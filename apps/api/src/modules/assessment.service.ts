import { ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import jwt from "jsonwebtoken";
import type {
  AuditLogItem,
  CourseSummary,
  DashboardOverview,
  ExamEntry,
  ExamPlanSummary,
  ExamQuestion,
  ExamResult,
  KnowledgePointDiagnostic,
  LearningAlert,
  LearningProfile,
  LearningRecommendation,
  QuestionSummary,
  ReviewTask,
  RoleCode,
  UserProfile
} from "@assessment/shared";
import { CreateCourseDto, CreateQuestionDto, SubmitExamDto } from "./dto";

interface SeedUser extends UserProfile {
  password: string;
  scope: "school" | "department" | "course" | "self";
}

interface SeedQuestion extends QuestionSummary {
  options: string[];
  answer: string[];
  knowledgePoints: string[];
}

interface LearnerSignal {
  learnerId: string;
  studyMinutes: number;
  completedTasks: number;
  pendingTasks: number;
  answerResults: Array<{
    questionId: string;
    knowledgePoint: string;
    score: number;
    maximumScore: number;
    wrong: boolean;
  }>;
}

const managementRoles: RoleCode[] = ["platform_admin", "org_admin", "course_admin", "supervisor", "auditor"];

@Injectable()
export class AssessmentService {
  private users: SeedUser[] = [
    {
      id: "u-platform",
      name: "平台管理员",
      username: "admin",
      password: "Admin@123",
      role: "platform_admin",
      orgName: "马克思主义学院",
      scope: "school"
    },
    {
      id: "u-teacher",
      name: "任课教师",
      username: "teacher",
      password: "Teacher@123",
      role: "course_admin",
      orgName: "马克思主义学院 思政教研室",
      scope: "course"
    },
    {
      id: "u-question",
      name: "题库管理员",
      username: "question",
      password: "Question@123",
      role: "question_admin",
      orgName: "马克思主义学院 题库中心",
      scope: "course"
    },
    {
      id: "u-supervisor",
      name: "学习督导员",
      username: "supervisor",
      password: "Supervisor@123",
      role: "supervisor",
      orgName: "2026级一班",
      scope: "department"
    },
    {
      id: "u-learner",
      name: "张同学",
      username: "student",
      password: "Student@123",
      role: "learner",
      orgName: "2026级一班",
      scope: "self"
    }
  ];

  private courses: CourseSummary[] = [
    {
      id: "course-1",
      title: "习近平新时代中国特色社会主义思想概论",
      category: "必修课程",
      status: "published",
      requiredMinutes: 180,
      completionRate: 76,
      learnerCount: 128
    },
    {
      id: "course-2",
      title: "马克思主义基本原理专题学习",
      category: "理论专题",
      status: "published",
      requiredMinutes: 120,
      completionRate: 68,
      learnerCount: 96
    },
    {
      id: "course-3",
      title: "党史学习教育专题",
      category: "专题教育",
      status: "draft",
      requiredMinutes: 90,
      completionRate: 0,
      learnerCount: 0
    }
  ];

  private questions: SeedQuestion[] = [
    {
      id: "q-1",
      bankName: "理论基础题库",
      type: "single",
      difficulty: "easy",
      stem: "中国特色社会主义最本质的特征是什么？",
      options: ["人民当家作主", "中国共产党领导", "依法治国", "共同富裕"],
      answer: ["中国共产党领导"],
      knowledgePoints: ["党的领导"],
      score: 20
    },
    {
      id: "q-2",
      bankName: "理论基础题库",
      type: "multiple",
      difficulty: "medium",
      stem: "思想理论学习过程评价通常包括哪些数据？",
      options: ["学习时长", "章节完成情况", "考试成绩", "无关浏览记录"],
      answer: ["学习时长", "章节完成情况", "考试成绩"],
      knowledgePoints: ["过程性评价", "学习证据"],
      score: 30
    },
    {
      id: "q-3",
      bankName: "党史学习题库",
      type: "judge",
      difficulty: "easy",
      stem: "考试成绩发布后仍应保留题目与答案快照，便于追溯。",
      options: ["正确", "错误"],
      answer: ["正确"],
      knowledgePoints: ["评价追溯"],
      score: 20
    },
    {
      id: "q-4",
      bankName: "党史学习题库",
      type: "single",
      difficulty: "medium",
      stem: "后台数据范围权限主要用于解决什么问题？",
      options: ["限制跨组织数据访问", "提升页面动画", "替代数据库备份", "关闭审计日志"],
      answer: ["限制跨组织数据访问"],
      knowledgePoints: ["数据权限"],
      score: 30
    }
  ];

  private exams: ExamPlanSummary[] = [
    {
      id: "exam-1",
      title: "思政理论阶段性考核",
      courseTitle: "习近平新时代中国特色社会主义思想概论",
      status: "running",
      startAt: "2026-06-02T09:00:00+08:00",
      endAt: "2026-06-08T18:00:00+08:00",
      durationMinutes: 60,
      passScore: 60
    }
  ];

  private learnerSignals: LearnerSignal[] = [
    {
      learnerId: "u-learner",
      studyMinutes: 146,
      completedTasks: 7,
      pendingTasks: 2,
      answerResults: [
        { questionId: "q-1", knowledgePoint: "党的领导", score: 20, maximumScore: 20, wrong: false },
        { questionId: "q-2", knowledgePoint: "过程性评价", score: 12, maximumScore: 30, wrong: true },
        { questionId: "q-3", knowledgePoint: "评价追溯", score: 20, maximumScore: 20, wrong: false },
        { questionId: "q-4", knowledgePoint: "数据权限", score: 0, maximumScore: 30, wrong: true }
      ]
    }
  ];

  private reviewTasks: ReviewTask[] = [
    {
      id: "review-1",
      type: "recommendation",
      title: "为张同学推送“数据权限与评价追溯”补弱材料",
      submittedBy: "学习画像引擎",
      targetRole: "course_admin",
      status: "pending",
      createdAt: "2026-06-05T10:00:00+08:00"
    },
    {
      id: "review-2",
      type: "question",
      title: "复核过程性评价题目区分度偏低问题",
      submittedBy: "题库质量巡检",
      targetRole: "question_admin",
      status: "pending",
      createdAt: "2026-06-05T11:20:00+08:00"
    }
  ];

  private auditLogs: AuditLogItem[] = [
    {
      id: "audit-1",
      actorName: "平台管理员",
      action: "发布考试计划",
      resourceType: "exam_plan",
      resourceName: "思政理论阶段性考核",
      createdAt: "2026-06-02T09:12:00+08:00",
      ip: "127.0.0.1"
    },
    {
      id: "audit-2",
      actorName: "张同学",
      action: "进入考试",
      resourceType: "exam_attempt",
      resourceName: "思政理论阶段性考核",
      createdAt: "2026-06-02T10:01:00+08:00",
      ip: "127.0.0.1"
    }
  ];

  login(role: RoleCode, username: string, password: string) {
    const user = this.users.find((item) => item.role === role && item.username === username && item.password === password);
    if (!user) {
      throw new UnauthorizedException("角色、账号或密码不匹配");
    }
    const profile: UserProfile = {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      orgName: user.orgName
    };
    this.writeAudit(profile.name, "登录系统", "user", profile.username);
    return {
      token: jwt.sign(profile, process.env.JWT_SECRET ?? "dev-secret", { expiresIn: "8h" }),
      profile
    };
  }

  overview(user: UserProfile): DashboardOverview {
    const learnerView = user.role === "learner";
    return {
      learnerCount: learnerView ? 1 : 246,
      courseCount: this.listCourses(user).length,
      examCount: this.exams.length,
      passRate: learnerView ? 75 : 82,
      completionRate: learnerView ? this.learningProfile(user).overallMastery : 74,
      pendingReviews: managementRoles.includes(user.role) ? this.pendingReviews(user).length : 0,
      riskAlerts: managementRoles.includes(user.role) ? this.learningAlerts(user).length : Number(this.learningProfile(user).riskLevel !== "low")
    };
  }

  listCourses(user: UserProfile) {
    if (user.role === "learner") {
      return this.courses.filter((course) => course.status === "published");
    }
    return this.courses;
  }

  createCourse(dto: CreateCourseDto, user: UserProfile) {
    const course: CourseSummary = {
      id: `course-${this.courses.length + 1}`,
      title: dto.title,
      category: dto.category,
      status: "draft",
      requiredMinutes: Number(dto.requiredMinutes ?? 60),
      completionRate: 0,
      learnerCount: 0
    };
    this.courses.unshift(course);
    this.writeAudit(user.name, "创建课程", "course", course.title);
    return course;
  }

  listQuestions(): QuestionSummary[] {
    return this.questions.map(({ options: _options, answer: _answer, knowledgePoints: _knowledgePoints, ...question }) => question);
  }

  createQuestion(dto: CreateQuestionDto, user: UserProfile) {
    const question: SeedQuestion = {
      id: `q-${this.questions.length + 1}`,
      bankName: dto.bankName,
      type: dto.answer.length > 1 ? "multiple" : "single",
      difficulty: "medium",
      stem: dto.stem,
      options: dto.options,
      answer: dto.answer,
      knowledgePoints: ["待审核知识点"],
      score: Number(dto.score ?? 20)
    };
    this.questions.unshift(question);
    this.reviewTasks.unshift({
      id: `review-${Date.now()}`,
      type: "question",
      title: `审核新题：${question.stem}`,
      submittedBy: user.name,
      targetRole: "question_admin",
      status: "pending",
      createdAt: new Date().toISOString()
    });
    this.writeAudit(user.name, "新增试题并送审", "question", question.stem);
    return question;
  }

  listExams(user?: UserProfile) {
    if (user?.role === "learner") {
      return this.exams.filter((exam) => exam.status === "running" || exam.status === "published");
    }
    return this.exams;
  }

  examEntry(examId: string, user?: UserProfile): ExamEntry {
    const exam = this.exams.find((item) => item.id === examId || examId === "demo");
    if (!exam) {
      throw new NotFoundException("考试不存在");
    }
    const questions: ExamQuestion[] = this.questions.map(({ answer: _answer, bankName: _bankName, difficulty: _difficulty, knowledgePoints: _knowledgePoints, ...question }) => question);
    if (user) {
      this.writeAudit(user.name, "进入考试", "exam_attempt", exam.title);
    }
    return {
      attemptId: `attempt-${Date.now()}`,
      exam,
      questions
    };
  }

  submitExam(attemptId: string, dto: SubmitExamDto, user?: UserProfile): ExamResult {
    const details = this.questions.map((question) => {
      const selected = dto.answers[question.id] ?? [];
      const correct = selected.length === question.answer.length && selected.every((item) => question.answer.includes(item));
      return {
        questionId: question.id,
        correct,
        score: correct ? question.score : 0
      };
    });
    const totalScore = details.reduce((sum, item) => sum + item.score, 0);
    const result = {
      attemptId,
      totalScore,
      passed: totalScore >= this.exams[0].passScore,
      submittedAt: new Date().toISOString(),
      details
    };
    this.writeAudit(user?.name ?? "张同学", "提交试卷", "exam_attempt", `${this.exams[0].title}：${totalScore}分`);
    return result;
  }

  learningProfile(user: UserProfile): LearningProfile {
    const learner = user.role === "learner" ? user : this.users.find((item) => item.role === "learner");
    if (!learner) {
      throw new NotFoundException("未找到学习者画像");
    }
    const signal = this.signalFor(learner.id);
    const diagnostics = this.diagnostics(signal);
    const total = signal.answerResults.reduce((sum, item) => sum + item.maximumScore, 0);
    const earned = signal.answerResults.reduce((sum, item) => sum + item.score, 0);
    const overallMastery = total ? Math.round((earned / total) * 100) : 0;
    const weakCount = diagnostics.filter((item) => item.status === "weak").length;
    return {
      learnerId: learner.id,
      learnerName: learner.name,
      role: learner.role,
      overallMastery,
      studyMinutes: signal.studyMinutes,
      completedTasks: signal.completedTasks,
      pendingTasks: signal.pendingTasks,
      riskLevel: weakCount >= 2 || signal.pendingTasks >= 3 ? "high" : weakCount === 1 ? "medium" : "low",
      diagnostics
    };
  }

  learningRecommendations(user: UserProfile): LearningRecommendation[] {
    const profile = this.learningProfile(user);
    return profile.diagnostics
      .filter((item) => item.status !== "mastered")
      .map((item, index) => ({
        id: `rec-${index + 1}`,
        title: item.status === "weak" ? `补弱：${item.knowledgePoint}` : `巩固：${item.knowledgePoint}`,
        type: item.status === "weak" ? "practice" : "material",
        knowledgePoint: item.knowledgePoint,
        reason: `当前掌握度 ${item.mastery}%，错题 ${item.errorCount} 道`,
        priority: item.status === "weak" ? "high" : "medium"
      }));
  }

  learningAlerts(user: UserProfile): LearningAlert[] {
    if (user.role === "learner") {
      throw new ForbiddenException("学生不能查看班级预警列表");
    }
    const profile = this.learningProfile(this.users.find((item) => item.role === "learner")!);
    const weak = profile.diagnostics.filter((item) => item.status === "weak");
    return weak.map((item, index) => ({
      id: `alert-${index + 1}`,
      learnerId: profile.learnerId,
      learnerName: profile.learnerName,
      level: item.mastery < 50 ? "critical" : "warning",
      title: `${profile.learnerName}在“${item.knowledgePoint}”存在薄弱风险`,
      reason: `掌握度 ${item.mastery}%，需要教师确认干预方案`,
      ownerRole: "course_admin",
      status: "open"
    }));
  }

  pendingReviews(user: UserProfile): ReviewTask[] {
    if (user.role === "platform_admin" || user.role === "org_admin" || user.role === "supervisor") {
      return this.reviewTasks.filter((task) => task.status === "pending");
    }
    return this.reviewTasks.filter((task) => task.status === "pending" && task.targetRole === user.role);
  }

  approveReview(id: string, user: UserProfile): ReviewTask {
    const task = this.reviewTasks.find((item) => item.id === id);
    if (!task) {
      throw new NotFoundException("审核任务不存在");
    }
    if (!["platform_admin", "org_admin", "supervisor", task.targetRole].includes(user.role)) {
      throw new ForbiddenException("当前角色不能审核该任务");
    }
    task.status = "approved";
    task.comment = `${user.name}已确认处理`;
    this.writeAudit(user.name, "审核通过", task.type, task.title);
    return task;
  }

  listAuditLogs() {
    return this.auditLogs.slice(0, 20);
  }

  private signalFor(learnerId: string): LearnerSignal {
    return this.learnerSignals.find((item) => item.learnerId === learnerId) ?? {
      learnerId,
      studyMinutes: 0,
      completedTasks: 0,
      pendingTasks: 0,
      answerResults: []
    };
  }

  private diagnostics(signal: LearnerSignal): KnowledgePointDiagnostic[] {
    const groups = new Map<string, LearnerSignal["answerResults"]>();
    for (const result of signal.answerResults) {
      groups.set(result.knowledgePoint, [...(groups.get(result.knowledgePoint) ?? []), result]);
    }
    return [...groups.entries()].map(([knowledgePoint, items]) => {
      const total = items.reduce((sum, item) => sum + item.maximumScore, 0);
      const earned = items.reduce((sum, item) => sum + item.score, 0);
      const mastery = total ? Math.round((earned / total) * 100) : 0;
      const trend: KnowledgePointDiagnostic["trend"] = mastery >= 80 ? "up" : mastery >= 60 ? "flat" : "down";
      const status: KnowledgePointDiagnostic["status"] = mastery >= 80 ? "mastered" : mastery >= 60 ? "developing" : "weak";
      return {
        knowledgePoint,
        mastery,
        errorCount: items.filter((item) => item.wrong).length,
        trend,
        status
      };
    }).sort((left, right) => left.mastery - right.mastery);
  }

  private writeAudit(actorName: string, action: string, resourceType: string, resourceName: string) {
    this.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      actorName,
      action,
      resourceType,
      resourceName,
      createdAt: new Date().toISOString(),
      ip: "127.0.0.1"
    });
  }
}
