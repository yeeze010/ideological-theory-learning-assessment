import { AssessmentService } from "./assessment.service";

describe("AssessmentService", () => {
  const learner = {
    id: "u-learner",
    name: "张同学",
    username: "student",
    role: "learner" as const,
    orgName: "2026级一班"
  };

  it("scores submitted exam answers", () => {
    const service = new AssessmentService();
    const entry = service.examEntry("exam-1", learner);
    const result = service.submitExam(entry.attemptId, {
      answers: {
        "q-1": ["中国共产党领导"],
        "q-2": ["学习时长", "章节完成情况", "考试成绩"],
        "q-3": ["正确"],
        "q-4": ["限制跨组织数据访问"]
      }
    }, learner);

    expect(result.totalScore).toBe(100);
    expect(result.passed).toBe(true);
  });

  it("requires role, username and password to match", () => {
    const service = new AssessmentService();

    expect(service.login("learner", "student", "Student@123").profile.role).toBe("learner");
    expect(() => service.login("course_admin", "student", "Student@123")).toThrow("角色、账号或密码不匹配");
  });

  it("builds learner profile, recommendations and teacher alerts", () => {
    const service = new AssessmentService();
    const teacher = service.login("course_admin", "teacher", "Teacher@123").profile;
    const profile = service.learningProfile(learner);

    expect(profile.riskLevel).toBe("high");
    expect(profile.diagnostics[0].knowledgePoint).toBe("数据权限");
    expect(service.learningRecommendations(learner)[0].priority).toBe("high");
    expect(service.learningAlerts(teacher)).toHaveLength(2);
  });

  it("filters review tasks by role and records approvals", () => {
    const service = new AssessmentService();
    const questionAdmin = service.login("question_admin", "question", "Question@123").profile;
    const visible = service.pendingReviews(questionAdmin);

    expect(visible.every((task) => task.targetRole === "question_admin")).toBe(true);
    const approved = service.approveReview(visible[0].id, questionAdmin);
    expect(approved.status).toBe("approved");
  });
});
