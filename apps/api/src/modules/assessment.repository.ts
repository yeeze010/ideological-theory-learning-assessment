import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, type User } from "@prisma/client";
import { isRoleCode, type RoleCode } from "@assessment/shared";
import { PrismaService } from "../database/prisma.service";
import type { AuthenticatedUser } from "./auth.types";
import type { CreateCourseDto, CreateExamPlanDto, CreateInterventionDto, CreateQuestionDto, SubmitExamDto } from "./dto";

type DbClient = Prisma.TransactionClient | PrismaService;

export interface AuthUserRecord {
  id: string;
  tenantId: string;
  orgId: string;
  username: string;
  name: string;
  passwordHash: string;
  status: string;
  tokenVersion: number;
  failedLoginCount: number;
  lockedUntil: Date | null;
  orgName: string;
  roles: RoleCode[];
}

function stringArray(value: Prisma.JsonValue): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function roleCodes(values: string[]): RoleCode[] {
  return values.filter(isRoleCode);
}

@Injectable()
export class AssessmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUserForLogin(username: string): Promise<AuthUserRecord | null> {
    const user = await this.prisma.user.findFirst({
      where: { username },
      include: { org: true, roles: { include: { role: true } } }
    });
    return user ? this.toAuthUser(user) : null;
  }

  async findActiveUserById(id: string): Promise<AuthUserRecord | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { org: true, roles: { include: { role: true } } }
    });
    return user ? this.toAuthUser(user) : null;
  }

  async recordLoginFailure(user: AuthUserRecord): Promise<void> {
    const nextCount = user.failedLoginCount + 1;
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: nextCount,
        lockedUntil: nextCount >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null
      }
    });
  }

  async recordLoginSuccess(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { failedLoginCount: 0, lockedUntil: null }
    });
  }

  async writeAudit(
    user: Pick<AuthenticatedUser, "id" | "tenantId" | "name">,
    action: string,
    resourceType: string,
    resourceName: string,
    metadata: Prisma.InputJsonValue = {}
  ): Promise<void> {
    await this.createAudit(this.prisma, user, action, resourceType, resourceName, metadata);
  }

  async listCourses(user: AuthenticatedUser) {
    const courses = await this.prisma.course.findMany({
      where: {
        tenantId: user.tenantId,
        ...(user.role === "learner" ? { status: "published", enrollments: { some: { userId: user.id } } } : {})
      },
      include: { enrollments: { select: { completionRate: true } } },
      orderBy: { createdAt: "desc" }
    });
    return courses.map((course) => ({
      id: course.id,
      title: course.title,
      category: course.category,
      status: course.status,
      requiredMinutes: course.requiredMinutes,
      completionRate: course.enrollments.length
        ? Math.round(course.enrollments.reduce((sum, item) => sum + item.completionRate, 0) / course.enrollments.length)
        : 0,
      learnerCount: course.enrollments.length
    }));
  }

  async createCourse(dto: CreateCourseDto, user: AuthenticatedUser) {
    return this.prisma.$transaction(async (transaction) => {
      const course = await transaction.course.create({
        data: {
          tenantId: user.tenantId,
          title: dto.title,
          category: dto.category,
          status: "draft",
          requiredMinutes: dto.requiredMinutes ?? 60
        }
      });
      await this.createAudit(transaction, user, "创建课程", "course", course.title);
      return {
        id: course.id,
        title: course.title,
        category: course.category,
        status: course.status,
        requiredMinutes: course.requiredMinutes,
        completionRate: 0,
        learnerCount: 0
      };
    });
  }

  async publishCourse(id: string, user: AuthenticatedUser) {
    return this.prisma.$transaction(async (transaction) => {
      const course = await transaction.course.findFirst({ where: { id, tenantId: user.tenantId } });
      if (!course) throw new NotFoundException("课程不存在或不在当前数据范围");
      if (course.status === "archived") throw new ConflictException("已归档课程不能重新发布");

      const learners = await transaction.user.findMany({
        where: this.learnerScope(user),
        select: { id: true }
      });
      const published = await transaction.course.update({
        where: { id: course.id },
        data: { status: "published" }
      });
      for (const learner of learners) {
        await transaction.courseEnrollment.upsert({
          where: { courseId_userId: { courseId: course.id, userId: learner.id } },
          create: { courseId: course.id, userId: learner.id, pendingTasks: 1 },
          update: { status: "learning", pendingTasks: { increment: 1 } }
        });
      }
      await this.createAudit(transaction, user, "发布学习任务", "course", published.title, { learnerCount: learners.length });
      const enrollments = await transaction.courseEnrollment.findMany({ where: { courseId: course.id }, select: { completionRate: true } });
      return {
        id: published.id,
        title: published.title,
        category: published.category,
        status: published.status,
        requiredMinutes: published.requiredMinutes,
        completionRate: enrollments.length ? Math.round(enrollments.reduce((sum, item) => sum + item.completionRate, 0) / enrollments.length) : 0,
        learnerCount: enrollments.length
      };
    });
  }

  async listQuestions(user: AuthenticatedUser) {
    return this.prisma.question.findMany({
      where: { tenantId: user.tenantId },
      select: { id: true, bankName: true, type: true, difficulty: true, stem: true, score: true, status: true },
      orderBy: { createdAt: "desc" }
    });
  }

  async createQuestionWithReview(dto: CreateQuestionDto, user: AuthenticatedUser) {
    return this.prisma.$transaction(async (transaction) => {
      const question = await transaction.question.create({
        data: {
          tenantId: user.tenantId,
          bankName: dto.bankName,
          type: dto.answer.length > 1 ? "multiple" : "single",
          difficulty: "medium",
          stem: dto.stem,
          options: dto.options,
          answer: dto.answer,
          knowledgePoints: ["待审核知识点"],
          score: dto.score ?? 20,
          status: "pending_review",
          createdById: user.id
        }
      });
      await transaction.reviewTask.create({
        data: {
          questionId: question.id,
          type: "question",
          title: `审核新题：${question.stem}`,
          submittedBy: user.name,
          targetRole: "question_admin"
        }
      });
      await this.createAudit(transaction, user, "新增试题并送审", "question", question.stem);
      return question;
    });
  }

  async publishQuestion(id: string, user: AuthenticatedUser) {
    return this.prisma.$transaction(async (transaction) => {
      const question = await transaction.question.findFirst({ where: { id, tenantId: user.tenantId } });
      if (!question) throw new NotFoundException("题目不存在或不在当前数据范围");
      if (question.status === "archived") throw new ConflictException("已归档题目不能发布");
      const published = await transaction.question.update({ where: { id }, data: { status: "published" } });
      await transaction.reviewTask.updateMany({
        where: { questionId: id, status: "pending" },
        data: { status: "approved", reviewerId: user.id, reviewedAt: new Date(), comment: `${user.name}已发布题目` }
      });
      await this.createAudit(transaction, user, "发布题目", "question", published.stem);
      return published;
    });
  }

  async createExamPlan(dto: CreateExamPlanDto, user: AuthenticatedUser) {
    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);
    if (endAt <= startAt) throw new ConflictException("考试结束时间必须晚于开始时间");
    const course = await this.prisma.course.findFirst({ where: { id: dto.courseId, tenantId: user.tenantId } });
    if (!course) throw new NotFoundException("课程不存在或不在当前数据范围");
    if (course.status !== "published") throw new ConflictException("请先发布课程任务，再创建考试");
    const questionIds: string[] = Array.from(new Set<string>(dto.questionIds));
    if (!questionIds.length) throw new ConflictException("至少选择一道已发布题目");
    const questions = await this.prisma.question.findMany({
      where: { tenantId: user.tenantId, id: { in: questionIds }, status: "published" },
      select: { id: true, score: true }
    });
    if (questions.length !== questionIds.length) throw new ConflictException("只能使用当前租户内已发布的题目");

    return this.prisma.$transaction(async (transaction) => {
      const exam = await transaction.examPlan.create({
        data: {
          courseId: course.id,
          title: dto.title.trim(),
          status: "published",
          startAt,
          endAt,
          durationMinutes: dto.durationMinutes,
          passScore: dto.passScore,
          questions: {
            create: questionIds.map((questionId, index) => ({
              question: { connect: { id: questionId } },
              sort: index + 1,
              score: questions.find((question) => question.id === questionId)!.score
            }))
          }
        },
        include: { course: true }
      });
      await this.createAudit(transaction, user, "发布考试任务", "exam_plan", exam.title, { questionCount: questionIds.length });
      return exam;
    });
  }

  async listExams(user: AuthenticatedUser) {
    return this.prisma.examPlan.findMany({
      where: {
        course: {
          tenantId: user.tenantId,
          ...(user.role === "learner" ? { enrollments: { some: { userId: user.id } } } : {})
        },
        ...(user.role === "learner" ? { status: { in: ["published", "running"] } } : {})
      },
      include: { course: true },
      orderBy: { startAt: "desc" }
    });
  }

  async createExamEntry(examId: string, user: AuthenticatedUser) {
    return this.prisma.$transaction(async (transaction) => {
      const exam = await transaction.examPlan.findFirst({
        where: {
          ...(examId === "demo" ? { status: { in: ["running", "published"] } } : { id: examId }),
          course: { tenantId: user.tenantId, enrollments: { some: { userId: user.id } } }
        },
        include: {
          course: true,
          questions: { orderBy: { sort: "asc" }, include: { question: true } }
        }
      });
      if (!exam) {
        throw new NotFoundException("考试不存在或当前学习者未报名该课程");
      }
      const now = Date.now();
      if (!(["published", "running"].includes(exam.status)) || now < exam.startAt.getTime() || now > exam.endAt.getTime()) {
        throw new ConflictException("当前不在考试开放时间内");
      }
      const attempt = await transaction.examAttempt.create({
        data: { examPlanId: exam.id, userId: user.id }
      });
      await this.createAudit(transaction, user, "进入考试", "exam_attempt", exam.title, { attemptId: attempt.id });
      return { exam, attemptId: attempt.id };
    });
  }

  async submitExam(attemptId: string, dto: SubmitExamDto, user: AuthenticatedUser) {
    return this.prisma.$transaction(async (transaction) => {
      const attempt = await transaction.examAttempt.findFirst({
        where: { id: attemptId, userId: user.id },
        include: {
          examPlan: {
            include: {
              course: true,
              questions: { orderBy: { sort: "asc" }, include: { question: true } }
            }
          }
        }
      });
      if (!attempt) {
        throw new NotFoundException("考试作答记录不存在");
      }
      if (attempt.submittedAt) {
        throw new ConflictException("该试卷已经提交，不能重复交卷");
      }

      const details = attempt.examPlan.questions.map((link) => {
        const selected = dto.answers[link.questionId] ?? [];
        const answer = stringArray(link.question.answer);
        const correct = selected.length === answer.length && selected.every((item) => answer.includes(item));
        const knowledgePoints = stringArray(link.question.knowledgePoints);
        return {
          questionId: link.questionId,
          correct,
          score: correct ? link.score : 0,
          feedback: correct ? "回答正确" : "回答未命中标准答案，已纳入错题反馈，请完成补学后再次练习",
          knowledgePoints
        };
      });
      const totalScore = details.reduce((sum, item) => sum + item.score, 0);
      const submittedAt = new Date();
      const updated = await transaction.examAttempt.updateMany({
        where: { id: attempt.id, userId: user.id, submittedAt: null },
        data: {
          answers: dto.answers,
          details,
          totalScore,
          passed: totalScore >= attempt.examPlan.passScore,
          status: "submitted",
          submittedAt
        }
      });
      if (updated.count !== 1) {
        throw new ConflictException("该试卷已经提交，不能重复交卷");
      }

      for (const detail of details) {
        const link = attempt.examPlan.questions.find((item) => item.questionId === detail.questionId)!;
        const points = stringArray(link.question.knowledgePoints);
        for (const pointName of points.length ? points : ["未分类知识点"]) {
          let point = await transaction.knowledgePoint.findFirst({
            where: { courseId: attempt.examPlan.courseId, name: pointName }
          });
          point ??= await transaction.knowledgePoint.create({
            data: { courseId: attempt.examPlan.courseId, name: pointName }
          });
          await transaction.answerDiagnostic.create({
            data: {
              attemptId: attempt.id,
              learnerId: user.id,
              questionId: detail.questionId,
              knowledgePointId: point.id,
              score: detail.score,
              maximumScore: link.score,
              isWrong: !detail.correct,
              answeredAt: submittedAt
            }
          });
        }
      }

      const diagnostics = await transaction.answerDiagnostic.findMany({
        where: { learnerId: user.id },
        include: { knowledgePoint: true }
      });
      const enrollment = await transaction.courseEnrollment.findUnique({
        where: { courseId_userId: { courseId: attempt.examPlan.courseId, userId: user.id } }
      });
      const profile = this.calculateProfile(diagnostics, enrollment);
      await transaction.learningProfileSnapshot.upsert({
        where: { learnerId_periodKey: { learnerId: user.id, periodKey: "latest" } },
        create: { learnerId: user.id, periodKey: "latest", ...profile },
        update: profile
      });

      for (const diagnostic of profile.diagnostics) {
        if (diagnostic.status === "mastered") continue;
        const priority = diagnostic.status === "weak" ? "high" : "medium";
        const recommendation = await transaction.learningRecommendation.create({
          data: {
            learnerId: user.id,
            sourceAttemptId: attempt.id,
            type: diagnostic.status === "weak" ? "practice" : "material",
            title: `${diagnostic.status === "weak" ? "补弱" : "巩固"}：${diagnostic.knowledgePoint}`,
            knowledgePoint: diagnostic.knowledgePoint,
            reason: `当前掌握度 ${diagnostic.mastery}%，错题 ${diagnostic.errorCount} 道`,
            priority
          }
        });
        await transaction.reviewTask.create({
          data: {
            type: "recommendation",
            title: `审核学习建议：${recommendation.title}`,
            submittedBy: "学习画像引擎",
            targetRole: "course_admin"
          }
        });
        if (diagnostic.status === "weak") {
          await transaction.learningAlert.create({
            data: {
              learnerId: user.id,
              sourceAttemptId: attempt.id,
              level: diagnostic.mastery < 50 ? "critical" : "warning",
              title: `${user.name}在“${diagnostic.knowledgePoint}”存在薄弱风险`,
              reason: `掌握度 ${diagnostic.mastery}%，需要教师确认干预方案`,
              ownerRole: "course_admin"
            }
          });
        }
      }

      await this.createAudit(
        transaction,
        user,
        "提交试卷",
        "exam_attempt",
        `${attempt.examPlan.title}：${totalScore}分`,
        { attemptId: attempt.id }
      );
      return {
        attemptId: attempt.id,
        totalScore,
        passed: totalScore >= attempt.examPlan.passScore,
        submittedAt: submittedAt.toISOString(),
        details
      };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async resolveLearner(user: AuthenticatedUser) {
    if (user.role === "learner") {
      return this.prisma.user.findUnique({ where: { id: user.id }, include: { org: true } });
    }
    return this.prisma.user.findFirst({
      where: {
        tenantId: user.tenantId,
        status: "enabled",
        roles: { some: { role: { code: "learner" } } }
      },
      include: { org: true },
      orderBy: { createdAt: "asc" }
    });
  }

  async learningProfileData(learnerId: string) {
    const [diagnostics, enrollments] = await Promise.all([
      this.prisma.answerDiagnostic.findMany({
        where: { learnerId },
        include: { knowledgePoint: true }
      }),
      this.prisma.courseEnrollment.findMany({ where: { userId: learnerId } })
    ]);
    return this.calculateProfile(diagnostics, {
      studyMinutes: enrollments.reduce((sum, item) => sum + item.studyMinutes, 0),
      completedTasks: enrollments.reduce((sum, item) => sum + item.completedTasks, 0),
      pendingTasks: enrollments.reduce((sum, item) => sum + item.pendingTasks, 0)
    });
  }

  async learningRecommendations(learnerId: string) {
    return this.prisma.learningRecommendation.findMany({
      where: { learnerId, status: { not: "resolved" } },
      orderBy: [{ priority: "asc" }, { createdAt: "desc" }]
    });
  }

  async learningAlerts(user: AuthenticatedUser) {
    return this.prisma.learningAlert.findMany({
      where: {
        learner: { tenantId: user.tenantId, ...(user.role === "org_admin" ? { orgId: user.orgId } : {}) },
        status: { not: "resolved" }
      },
      include: { learner: { select: { name: true } } },
      orderBy: { createdAt: "desc" }
    });
  }

  async classResults(user: AuthenticatedUser) {
    const learners = await this.prisma.user.findMany({
      where: this.learnerScope(user),
      select: {
        id: true,
        name: true,
        org: { select: { name: true } },
        enrollments: { select: { pendingTasks: true } },
        profileSnapshots: { where: { periodKey: "latest" }, select: { overallMastery: true }, take: 1 },
        examAttempts: {
          where: { status: "submitted", examPlan: { course: { tenantId: user.tenantId } } },
          orderBy: { submittedAt: "desc" },
          take: 1,
          select: {
            totalScore: true,
            passed: true,
            submittedAt: true,
            diagnostics: { where: { isWrong: true }, select: { id: true } },
            examPlan: { select: { title: true, course: { select: { id: true, title: true } } } }
          }
        }
      }
    });
    return learners.map((learner) => {
      const latest = learner.examAttempts[0];
      const status = latest ? (latest.passed ? "passed" : "needs_support") : "not_started";
      return {
        learnerId: learner.id,
        learnerName: learner.name,
        className: learner.org.name,
        latestCourseId: latest?.examPlan.course.id,
        latestCourseTitle: latest?.examPlan.course.title,
        latestExamTitle: latest?.examPlan.title,
        latestScore: latest?.totalScore ?? null,
        latestPassed: latest?.passed ?? null,
        status,
        mastery: learner.profileSnapshots[0]?.overallMastery ?? 0,
        wrongCount: latest?.diagnostics.length ?? 0,
        pendingTasks: learner.enrollments.reduce((sum, enrollment) => sum + enrollment.pendingTasks, 0),
        lastSubmittedAt: latest?.submittedAt?.toISOString() ?? null
      };
    });
  }

  async createIntervention(dto: CreateInterventionDto, user: AuthenticatedUser) {
    const learner = await this.prisma.user.findFirst({
      where: { id: dto.learnerId, ...this.learnerScope(user) },
      select: { id: true, name: true, enrollments: { orderBy: { updatedAt: "desc" }, select: { courseId: true } } }
    });
    if (!learner) throw new ForbiddenException("当前角色不能为该学生发起补学");
    const courseId = dto.courseId ?? learner.enrollments[0]?.courseId;
    if (dto.courseId && !learner.enrollments.some((enrollment) => enrollment.courseId === dto.courseId)) {
      throw new ForbiddenException("学生未加入该课程，不能发起补学");
    }
    return this.prisma.$transaction(async (transaction) => {
      const recommendation = await transaction.learningRecommendation.create({
        data: {
          learnerId: learner.id,
          sourceAttemptId: dto.sourceAttemptId,
          type: "teacher_action",
          title: dto.title.trim(),
          knowledgePoint: dto.knowledgePoint.trim(),
          reason: dto.reason.trim(),
          priority: dto.priority,
          status: "pending_review"
        }
      });
      if (courseId) {
        await transaction.courseEnrollment.update({
          where: { courseId_userId: { courseId, userId: learner.id } },
          data: { pendingTasks: { increment: 1 } }
        });
      }
      await this.createAudit(transaction, user, "发起补学", "learning_intervention", recommendation.title, {
        learnerId: learner.id,
        courseId: courseId ?? null
      });
      return {
        id: recommendation.id,
        learnerId: learner.id,
        learnerName: learner.name,
        title: recommendation.title,
        knowledgePoint: recommendation.knowledgePoint,
        reason: recommendation.reason,
        priority: recommendation.priority as "low" | "medium" | "high",
        createdAt: recommendation.createdAt.toISOString()
      };
    });
  }

  async pendingReviews(user: AuthenticatedUser) {
    const allRoles: RoleCode[] = ["platform_admin", "org_admin", "supervisor"];
    return this.prisma.reviewTask.findMany({
      where: {
        status: "pending",
        ...(allRoles.includes(user.role) ? {} : { targetRole: user.role })
      },
      orderBy: { createdAt: "desc" }
    });
  }

  async approveReview(id: string, user: AuthenticatedUser) {
    return this.prisma.$transaction(async (transaction) => {
      const task = await transaction.reviewTask.findUnique({ where: { id } });
      if (!task) throw new NotFoundException("审核任务不存在");
      if (!["platform_admin", "org_admin", "supervisor", task.targetRole].includes(user.role)) {
        throw new ForbiddenException("当前角色不能审核该任务");
      }
      const approved = await transaction.reviewTask.update({
        where: { id },
        data: {
          status: "approved",
          reviewerId: user.id,
          reviewedAt: new Date(),
          comment: `${user.name}已确认处理`
        }
      });
      if (task.questionId) {
        await transaction.question.update({ where: { id: task.questionId }, data: { status: "published" } });
      }
      await this.createAudit(transaction, user, "审核通过", task.type, task.title);
      return approved;
    });
  }

  async listAuditLogs(user: AuthenticatedUser) {
    return this.prisma.auditLog.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { createdAt: "desc" },
      take: 20
    });
  }

  async dashboardCounts(user: AuthenticatedUser) {
    const learnerFilter = user.role === "org_admin" ? { orgId: user.orgId } : {};
    const [learnerCount, examCount, attempts, enrollments] = await Promise.all([
      this.prisma.user.count({
        where: { tenantId: user.tenantId, ...learnerFilter, roles: { some: { role: { code: "learner" } } } }
      }),
      this.prisma.examPlan.count({ where: { course: { tenantId: user.tenantId } } }),
      this.prisma.examAttempt.findMany({
        where: {
          status: "submitted",
          ...(user.role === "learner" ? { userId: user.id } : { user: { tenantId: user.tenantId, ...learnerFilter } })
        },
        select: { passed: true }
      }),
      this.prisma.courseEnrollment.findMany({
        where: user.role === "learner" ? { userId: user.id } : { user: { tenantId: user.tenantId, ...learnerFilter } },
        select: { completionRate: true }
      })
    ]);
    return {
      learnerCount: user.role === "learner" ? 1 : learnerCount,
      examCount,
      passRate: attempts.length ? Math.round((attempts.filter((item) => item.passed).length / attempts.length) * 100) : 0,
      completionRate: enrollments.length
        ? Math.round(enrollments.reduce((sum, item) => sum + item.completionRate, 0) / enrollments.length)
        : 0
    };
  }

  private toAuthUser(user: User & {
    org: { name: string };
    roles: Array<{ role: { code: string } }>;
  }): AuthUserRecord {
    return {
      id: user.id,
      tenantId: user.tenantId,
      orgId: user.orgId,
      username: user.username,
      name: user.name,
      passwordHash: user.passwordHash,
      status: user.status,
      tokenVersion: user.tokenVersion,
      failedLoginCount: user.failedLoginCount,
      lockedUntil: user.lockedUntil,
      orgName: user.org.name,
      roles: roleCodes(user.roles.map((item) => item.role.code))
    };
  }

  private learnerScope(user: AuthenticatedUser): Prisma.UserWhereInput {
    return {
      tenantId: user.tenantId,
      status: "enabled",
      roles: { some: { role: { code: "learner" } } },
      ...(user.role === "platform_admin" ? {} : { org: { OR: [{ id: user.orgId }, { parentId: user.orgId }] } })
    };
  }

  private calculateProfile(
    diagnostics: Array<{
      score: number;
      maximumScore: number;
      isWrong: boolean;
      knowledgePoint: { name: string };
    }>,
    enrollment: { studyMinutes: number; completedTasks: number; pendingTasks: number } | null
  ) {
    const groups = new Map<string, typeof diagnostics>();
    for (const diagnostic of diagnostics) {
      groups.set(diagnostic.knowledgePoint.name, [...(groups.get(diagnostic.knowledgePoint.name) ?? []), diagnostic]);
    }
    const items = [...groups.entries()].map(([knowledgePoint, values]) => {
      const maximum = values.reduce((sum, item) => sum + item.maximumScore, 0);
      const earned = values.reduce((sum, item) => sum + item.score, 0);
      const mastery = maximum ? Math.round((earned / maximum) * 100) : 0;
      return {
        knowledgePoint,
        mastery,
        errorCount: values.filter((item) => item.isWrong).length,
        trend: mastery >= 80 ? "up" : mastery >= 60 ? "flat" : "down",
        status: mastery >= 80 ? "mastered" : mastery >= 60 ? "developing" : "weak"
      };
    }).sort((left, right) => left.mastery - right.mastery);
    const total = diagnostics.reduce((sum, item) => sum + item.maximumScore, 0);
    const earned = diagnostics.reduce((sum, item) => sum + item.score, 0);
    const weakCount = items.filter((item) => item.status === "weak").length;
    const pendingTasks = enrollment?.pendingTasks ?? 0;
    return {
      overallMastery: total ? Math.round((earned / total) * 100) : 0,
      studyMinutes: enrollment?.studyMinutes ?? 0,
      completedTasks: enrollment?.completedTasks ?? 0,
      pendingTasks,
      riskLevel: weakCount >= 2 || pendingTasks >= 3 ? "high" : weakCount === 1 ? "medium" : "low",
      diagnostics: items
    };
  }

  private async createAudit(
    client: DbClient,
    user: Pick<AuthenticatedUser, "id" | "tenantId" | "name">,
    action: string,
    resourceType: string,
    resourceName: string,
    metadata: Prisma.InputJsonValue = {}
  ): Promise<void> {
    await client.auditLog.create({
      data: {
        tenantId: user.tenantId,
        actorId: user.id,
        actorName: user.name,
        action,
        resourceType,
        resourceName,
        metadata
      }
    });
  }
}
