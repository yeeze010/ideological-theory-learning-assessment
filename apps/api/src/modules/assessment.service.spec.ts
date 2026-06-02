import { AssessmentService } from "./assessment.service";

describe("AssessmentService", () => {
  it("scores submitted exam answers", () => {
    const service = new AssessmentService();
    const entry = service.examEntry("exam-1");
    const result = service.submitExam(entry.attemptId, {
      answers: {
        "q-1": ["中国共产党领导"],
        "q-2": ["学习时长", "章节完成情况", "考试成绩"],
        "q-3": ["正确"],
        "q-4": ["限制跨组织数据访问"]
      }
    });

    expect(result.totalScore).toBe(100);
    expect(result.passed).toBe(true);
  });
});
