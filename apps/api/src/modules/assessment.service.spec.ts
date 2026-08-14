import type { AssessmentRepository } from "./assessment.repository";
import { AssessmentService } from "./assessment.service";
import type { AuthenticatedUser } from "./auth.types";

const learner: AuthenticatedUser = {
  id: "u-learner",
  tenantId: "tenant-1",
  orgId: "org-class",
  tokenVersion: 0,
  name: "张同学",
  username: "student",
  role: "learner",
  orgName: "2026级一班"
};

describe("AssessmentService", () => {
  it("returns an exam entry without exposing reference answers", async () => {
    const repository = {
      createExamEntry: jest.fn().mockResolvedValue({
        attemptId: "attempt-1",
        exam: {
          id: "exam-1",
          title: "阶段考核",
          status: "running",
          startAt: new Date("2026-08-01T00:00:00.000Z"),
          endAt: new Date("2026-08-31T00:00:00.000Z"),
          durationMinutes: 60,
          passScore: 60,
          course: { title: "思想理论课" },
          questions: [{
            score: 100,
            question: {
              id: "q-1",
              type: "single",
              stem: "测试题目",
              options: ["A", "B"],
              answer: ["A"]
            }
          }]
        }
      })
    } as unknown as AssessmentRepository;
    const service = new AssessmentService(repository);

    const entry = await service.examEntry("exam-1", learner);

    expect(entry.attemptId).toBe("attempt-1");
    expect(entry.questions[0]).toEqual({ id: "q-1", type: "single", stem: "测试题目", options: ["A", "B"], score: 100 });
    expect(entry.questions[0]).not.toHaveProperty("answer");
  });

  it("returns persisted profile diagnostics and recommendations", async () => {
    const repository = {
      resolveLearner: jest.fn().mockResolvedValue({ id: learner.id, name: learner.name }),
      learningProfileData: jest.fn().mockResolvedValue({
        overallMastery: 45,
        studyMinutes: 120,
        completedTasks: 5,
        pendingTasks: 3,
        riskLevel: "high",
        diagnostics: [{ knowledgePoint: "数据权限", mastery: 45, errorCount: 2, trend: "down", status: "weak" }]
      }),
      learningRecommendations: jest.fn().mockResolvedValue([{
        id: "rec-1",
        title: "补弱：数据权限",
        type: "practice",
        knowledgePoint: "数据权限",
        reason: "掌握度不足",
        priority: "high"
      }])
    } as unknown as AssessmentRepository;
    const service = new AssessmentService(repository);

    const profile = await service.learningProfile(learner);
    const recommendations = await service.learningRecommendations(learner);

    expect(profile.riskLevel).toBe("high");
    expect(profile.diagnostics[0].knowledgePoint).toBe("数据权限");
    expect(recommendations[0].priority).toBe("high");
  });
});
