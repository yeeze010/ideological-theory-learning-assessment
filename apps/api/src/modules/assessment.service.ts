import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import {
  isRoleCode,
  type AuditLogItem,
  type ClassResultSummary,
  type CourseStatus,
  type CourseSummary,
  type DashboardOverview,
  type ExamEntry,
  type ExamPlanSummary,
  type ExamQuestion,
  type ExamResult,
  type ExamStatus,
  type KnowledgePointDiagnostic,
  type LearningAlert,
  type LearningProfile,
  type LearningRecommendation,
  type QuestionSummary,
  type QuestionType,
  type ReviewTask,
  type RoleCode
} from "@assessment/shared";
import { AssessmentRepository } from "./assessment.repository";
import type { AuthenticatedUser } from "./auth.types";
import { CreateCourseDto, CreateExamPlanDto, CreateInterventionDto, CreateQuestionDto, SubmitExamDto } from "./dto";

const managementRoles: RoleCode[] = ["platform_admin", "org_admin", "course_admin", "supervisor", "auditor"];

@Injectable()
export class AssessmentService {
  constructor(private readonly repository: AssessmentRepository) {}

  async overview(user: AuthenticatedUser): Promise<DashboardOverview> {
    const [courses, counts, reviews, alerts] = await Promise.all([
      this.listCourses(user),
      this.repository.dashboardCounts(user),
      managementRoles.includes(user.role) ? this.pendingReviews(user) : Promise.resolve([]),
      user.role === "learner" ? Promise.resolve([]) : this.learningAlerts(user)
    ]);
    const profile = user.role === "learner" ? await this.learningProfile(user) : null;
    return {
      learnerCount: counts.learnerCount,
      courseCount: courses.length,
      examCount: counts.examCount,
      passRate: counts.passRate,
      completionRate: profile?.overallMastery ?? counts.completionRate,
      pendingReviews: reviews.length,
      riskAlerts: profile ? Number(profile.riskLevel !== "low") : alerts.length
    };
  }

  async listCourses(user: AuthenticatedUser): Promise<CourseSummary[]> {
    const courses = await this.repository.listCourses(user);
    return courses.map((course) => ({ ...course, status: course.status as CourseStatus }));
  }

  async createCourse(dto: CreateCourseDto, user: AuthenticatedUser): Promise<CourseSummary> {
    const course = await this.repository.createCourse(dto, user);
    return { ...course, status: course.status as CourseStatus };
  }

  async publishCourse(id: string, user: AuthenticatedUser): Promise<CourseSummary> {
    const course = await this.repository.publishCourse(id, user);
    return { ...course, status: course.status as CourseStatus };
  }

  async listQuestions(user: AuthenticatedUser): Promise<QuestionSummary[]> {
    const questions = await this.repository.listQuestions(user);
    return questions.map((question) => ({
      ...question,
      type: question.type as QuestionType,
      difficulty: question.difficulty as QuestionSummary["difficulty"],
      status: question.status as QuestionSummary["status"]
    }));
  }

  async createQuestion(dto: CreateQuestionDto, user: AuthenticatedUser): Promise<QuestionSummary> {
    const question = await this.repository.createQuestionWithReview(dto, user);
    return {
      id: question.id,
      bankName: question.bankName,
      type: question.type as QuestionType,
      difficulty: question.difficulty as QuestionSummary["difficulty"],
      stem: question.stem,
      score: question.score,
      status: question.status as QuestionSummary["status"]
    };
  }

  async publishQuestion(id: string, user: AuthenticatedUser): Promise<QuestionSummary> {
    const question = await this.repository.publishQuestion(id, user);
    return {
      id: question.id,
      bankName: question.bankName,
      type: question.type as QuestionType,
      difficulty: question.difficulty as QuestionSummary["difficulty"],
      stem: question.stem,
      score: question.score,
      status: question.status as QuestionSummary["status"]
    };
  }

  async createExamPlan(dto: CreateExamPlanDto, user: AuthenticatedUser): Promise<ExamPlanSummary> {
    const exam = await this.repository.createExamPlan(dto, user);
    return {
      id: exam.id,
      title: exam.title,
      courseTitle: exam.course.title,
      status: exam.status as ExamStatus,
      startAt: exam.startAt.toISOString(),
      endAt: exam.endAt.toISOString(),
      durationMinutes: exam.durationMinutes,
      passScore: exam.passScore
    };
  }

  async listExams(user: AuthenticatedUser): Promise<ExamPlanSummary[]> {
    const exams = await this.repository.listExams(user);
    return exams.map((exam) => ({
      id: exam.id,
      title: exam.title,
      courseTitle: exam.course.title,
      status: exam.status as ExamStatus,
      startAt: exam.startAt.toISOString(),
      endAt: exam.endAt.toISOString(),
      durationMinutes: exam.durationMinutes,
      passScore: exam.passScore
    }));
  }

  async examEntry(examId: string, user: AuthenticatedUser): Promise<ExamEntry> {
    const { exam, attemptId } = await this.repository.createExamEntry(examId, user);
    const questions: ExamQuestion[] = exam.questions.map((link) => ({
      id: link.question.id,
      type: link.question.type as QuestionType,
      stem: link.question.stem,
      options: Array.isArray(link.question.options)
        ? link.question.options.filter((item): item is string => typeof item === "string")
        : [],
      score: link.score
    }));
    return {
      attemptId,
      exam: {
        id: exam.id,
        title: exam.title,
        courseTitle: exam.course.title,
        status: exam.status as ExamStatus,
        startAt: exam.startAt.toISOString(),
        endAt: exam.endAt.toISOString(),
        durationMinutes: exam.durationMinutes,
        passScore: exam.passScore
      },
      questions
    };
  }

  submitExam(attemptId: string, dto: SubmitExamDto, user: AuthenticatedUser): Promise<ExamResult> {
    return this.repository.submitExam(attemptId, dto, user);
  }

  async learningProfile(user: AuthenticatedUser): Promise<LearningProfile> {
    const learner = await this.repository.resolveLearner(user);
    if (!learner) throw new NotFoundException("未找到学习者画像");
    const profile = await this.repository.learningProfileData(learner.id);
    return {
      learnerId: learner.id,
      learnerName: learner.name,
      role: "learner",
      overallMastery: profile.overallMastery,
      studyMinutes: profile.studyMinutes,
      completedTasks: profile.completedTasks,
      pendingTasks: profile.pendingTasks,
      riskLevel: profile.riskLevel as LearningProfile["riskLevel"],
      diagnostics: profile.diagnostics as KnowledgePointDiagnostic[]
    };
  }

  async learningRecommendations(user: AuthenticatedUser): Promise<LearningRecommendation[]> {
    const learner = await this.repository.resolveLearner(user);
    if (!learner) throw new NotFoundException("未找到学习者画像");
    const recommendations = await this.repository.learningRecommendations(learner.id);
    return recommendations.map((item) => ({
      id: item.id,
      title: item.title,
      type: item.type as LearningRecommendation["type"],
      knowledgePoint: item.knowledgePoint,
      reason: item.reason,
      priority: item.priority as LearningRecommendation["priority"]
    }));
  }

  async learningAlerts(user: AuthenticatedUser): Promise<LearningAlert[]> {
    if (user.role === "learner") throw new ForbiddenException("学生不能查看班级预警列表");
    const alerts = await this.repository.learningAlerts(user);
    return alerts.map((item) => ({
      id: item.id,
      learnerId: item.learnerId,
      learnerName: item.learner.name,
      level: item.level as LearningAlert["level"],
      title: item.title,
      reason: item.reason,
      ownerRole: isRoleCode(item.ownerRole) ? item.ownerRole : "course_admin",
      status: item.status as LearningAlert["status"]
    }));
  }

  async classResults(user: AuthenticatedUser): Promise<ClassResultSummary[]> {
    const results = await this.repository.classResults(user);
    return results.map((result) => ({
      ...result,
      status: result.status as ClassResultSummary["status"]
    }));
  }

  async createIntervention(dto: CreateInterventionDto, user: AuthenticatedUser) {
    return this.repository.createIntervention(dto, user);
  }

  async pendingReviews(user: AuthenticatedUser): Promise<ReviewTask[]> {
    const reviews = await this.repository.pendingReviews(user);
    return reviews.map((task) => this.reviewTask(task));
  }

  async approveReview(id: string, user: AuthenticatedUser): Promise<ReviewTask> {
    return this.reviewTask(await this.repository.approveReview(id, user));
  }

  async listAuditLogs(user: AuthenticatedUser): Promise<AuditLogItem[]> {
    const logs = await this.repository.listAuditLogs(user);
    return logs.map((log) => ({
      id: log.id,
      actorName: log.actorName,
      action: log.action,
      resourceType: log.resourceType,
      resourceName: log.resourceName,
      createdAt: log.createdAt.toISOString(),
      ip: log.ip
    }));
  }

  private reviewTask(task: {
    id: string;
    type: string;
    title: string;
    submittedBy: string;
    targetRole: string;
    status: string;
    comment: string | null;
    createdAt: Date;
  }): ReviewTask {
    return {
      id: task.id,
      type: task.type as ReviewTask["type"],
      title: task.title,
      submittedBy: task.submittedBy,
      targetRole: isRoleCode(task.targetRole) ? task.targetRole : "course_admin",
      status: task.status as ReviewTask["status"],
      comment: task.comment ?? undefined,
      createdAt: task.createdAt.toISOString()
    };
  }
}
