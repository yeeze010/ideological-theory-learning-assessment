import { Injectable, NotFoundException } from "@nestjs/common";
import jwt from "jsonwebtoken";
import type {
  CourseSummary,
  DashboardOverview,
  ExamEntry,
  ExamPlanSummary,
  ExamQuestion,
  ExamResult,
  AuditLogItem,
  QuestionSummary,
  UserProfile
} from "@assessment/shared";
import { CreateCourseDto, CreateQuestionDto, SubmitExamDto } from "./dto";

interface SeedQuestion extends QuestionSummary {
  options: string[];
  answer: string[];
}

@Injectable()
export class AssessmentService {
  private users: Array<UserProfile & { password: string }> = [
    {
      id: "u-admin",
      name: "系统管理员",
      username: "admin",
      password: "Admin@123",
      role: "org_admin",
      orgName: "马克思主义学院"
    },
    {
      id: "u-learner",
      name: "张同学",
      username: "student",
      password: "Student@123",
      role: "learner",
      orgName: "2026级一班"
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

  private auditLogs: AuditLogItem[] = [
    {
      id: "audit-1",
      actorName: "系统管理员",
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

  login(username: string, password: string) {
    const user = this.users.find((item) => item.username === username && item.password === password);
    if (!user) {
      throw new NotFoundException("账号或密码错误");
    }
    const profile: UserProfile = {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      orgName: user.orgName
    };
    return {
      token: jwt.sign(profile, process.env.JWT_SECRET ?? "dev-secret", { expiresIn: "8h" }),
      profile
    };
  }

  overview(): DashboardOverview {
    return {
      learnerCount: 246,
      courseCount: this.courses.length,
      examCount: this.exams.length,
      passRate: 82,
      completionRate: 74,
      pendingReviews: 6,
      riskAlerts: 3
    };
  }

  listCourses() {
    return this.courses;
  }

  createCourse(dto: CreateCourseDto) {
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
    this.writeAudit("系统管理员", "创建课程", "course", course.title);
    return course;
  }

  listQuestions(): QuestionSummary[] {
    return this.questions.map(({ options: _options, answer: _answer, ...question }) => question);
  }

  createQuestion(dto: CreateQuestionDto) {
    const question: SeedQuestion = {
      id: `q-${this.questions.length + 1}`,
      bankName: dto.bankName,
      type: dto.answer.length > 1 ? "multiple" : "single",
      difficulty: "medium",
      stem: dto.stem,
      options: dto.options,
      answer: dto.answer,
      score: Number(dto.score ?? 20)
    };
    this.questions.unshift(question);
    this.writeAudit("题库管理员", "新增试题", "question", question.stem);
    return question;
  }

  listExams() {
    return this.exams;
  }

  examEntry(examId: string): ExamEntry {
    const exam = this.exams.find((item) => item.id === examId);
    if (!exam) {
      throw new NotFoundException("考试不存在");
    }
    const questions: ExamQuestion[] = this.questions.map(({ answer: _answer, bankName: _bankName, difficulty: _difficulty, ...question }) => question);
    return {
      attemptId: `attempt-${Date.now()}`,
      exam,
      questions
    };
  }

  submitExam(attemptId: string, dto: SubmitExamDto): ExamResult {
    const details = this.questions.map((question) => {
      const selected = dto.answers[question.id] ?? [];
      const correct =
        selected.length === question.answer.length &&
        selected.every((item) => question.answer.includes(item));
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
    this.writeAudit("张同学", "提交试卷", "exam_attempt", `${this.exams[0].title}：${totalScore}分`);
    return result;
  }

  listAuditLogs() {
    return this.auditLogs.slice(0, 20);
  }
}
