import { AssessmentRepository } from "./assessment.repository";
import type { AuthenticatedUser } from "./auth.types";

const actor: AuthenticatedUser = {
  id: "u-teacher",
  tenantId: "tenant-1",
  orgId: "org-1",
  tokenVersion: 0,
  name: "任课教师",
  username: "teacher",
  role: "course_admin",
  orgName: "马克思主义学院"
};

describe("AssessmentRepository transactions", () => {
  it("creates a question, review task and audit log in one transaction", async () => {
    const question = {
      id: "q-new",
      tenantId: actor.tenantId,
      bankName: "理论题库",
      type: "single",
      difficulty: "medium",
      stem: "新增题目",
      options: ["A", "B"],
      answer: ["A"],
      knowledgePoints: ["待审核知识点"],
      score: 20
    };
    const transaction = {
      question: { create: jest.fn().mockResolvedValue(question) },
      reviewTask: { create: jest.fn().mockResolvedValue({}) },
      auditLog: { create: jest.fn().mockResolvedValue({}) }
    };
    const prisma = {
      $transaction: jest.fn((callback: (client: typeof transaction) => unknown) => callback(transaction))
    };
    const repository = new AssessmentRepository(prisma as never);

    await repository.createQuestionWithReview({
      bankName: "理论题库",
      stem: "新增题目",
      options: ["A", "B"],
      answer: ["A"],
      score: 20
    }, actor);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(transaction.question.create).toHaveBeenCalledTimes(1);
    expect(transaction.reviewTask.create).toHaveBeenCalledTimes(1);
    expect(transaction.auditLog.create).toHaveBeenCalledTimes(1);
  });

  it("submits, scores and diagnoses an attempt atomically", async () => {
    const attempt = {
      id: "attempt-1",
      submittedAt: null,
      examPlan: {
        id: "exam-1",
        courseId: "course-1",
        title: "阶段考核",
        passScore: 60,
        questions: [{
          questionId: "q-1",
          score: 100,
          question: { answer: ["A"], knowledgePoints: ["党的领导"] }
        }]
      }
    };
    const transaction = {
      examAttempt: {
        findFirst: jest.fn().mockResolvedValue(attempt),
        updateMany: jest.fn().mockResolvedValue({ count: 1 })
      },
      knowledgePoint: {
        findFirst: jest.fn().mockResolvedValue({ id: "kp-1" }),
        create: jest.fn()
      },
      answerDiagnostic: {
        create: jest.fn().mockResolvedValue({}),
        findMany: jest.fn().mockResolvedValue([{
          score: 100,
          maximumScore: 100,
          isWrong: false,
          knowledgePoint: { name: "党的领导" }
        }])
      },
      courseEnrollment: {
        findUnique: jest.fn().mockResolvedValue({ studyMinutes: 90, completedTasks: 3, pendingTasks: 1 })
      },
      learningProfileSnapshot: { upsert: jest.fn().mockResolvedValue({}) },
      learningRecommendation: { create: jest.fn() },
      learningAlert: { create: jest.fn() },
      reviewTask: { create: jest.fn() },
      auditLog: { create: jest.fn().mockResolvedValue({}) }
    };
    const prisma = {
      $transaction: jest.fn((callback: (client: typeof transaction) => unknown) => callback(transaction))
    };
    const repository = new AssessmentRepository(prisma as never);

    const result = await repository.submitExam("attempt-1", { answers: { "q-1": ["A"] } }, { ...actor, id: "u-learner", role: "learner" });

    expect(result.totalScore).toBe(100);
    expect(result.passed).toBe(true);
    expect(transaction.examAttempt.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ submittedAt: null }) }));
    expect(transaction.answerDiagnostic.create).toHaveBeenCalledTimes(1);
    expect(transaction.learningProfileSnapshot.upsert).toHaveBeenCalledTimes(1);
    expect(transaction.auditLog.create).toHaveBeenCalledTimes(1);
    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), expect.objectContaining({ isolationLevel: "Serializable" }));
  });
});
