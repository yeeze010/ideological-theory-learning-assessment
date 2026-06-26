import { AssessmentPlanningService } from './assessment-planning.service';
import { QuestionBankGovernanceService, type Question } from './question-bank-governance.service';

const baseQuestion = (id: string, difficulty: Question['difficulty']): Question => ({
  id,
  title: `关于马克思主义理论知识点${id}的情境判断题`,
  type: 'single',
  difficulty,
  knowledgePoints: ['马克思主义基本原理'],
  options: [
    { id: `${id}-a`, content: '符合理论要求', correct: true },
    { id: `${id}-b`, content: '不符合理论要求', correct: false },
    { id: `${id}-c`, content: '与理论无关', correct: false },
  ],
  explanation: '本题通过具体情境考查学习者对理论内涵、适用边界和实践要求的理解。',
  status: 'draft',
  version: 1,
  usageCount: 0,
  correctCount: 0,
  discrimination: 0.45,
  authorId: 'teacher-1',
  updatedAt: '2026-06-01T00:00:00.000Z',
});

describe('QuestionBankGovernanceService', () => {
  it('supports review, publication and balanced paper generation', () => {
    const service = new QuestionBankGovernanceService();
    ['easy', 'medium', 'hard'].forEach((difficulty, index) => {
      const question = service.register(baseQuestion(`q-${index}`, difficulty as Question['difficulty']));
      service.submitForReview(question.id);
      service.completeReview({
        questionId: question.id,
        reviewerId: 'reviewer-1',
        approved: true,
        comments: [],
        reviewedAt: '2026-06-02T00:00:00.000Z',
      });
    });
    const paper = service.generatePaper({
      totalQuestions: 3,
      difficultyWeights: { easy: 1, medium: 1, hard: 1 },
      typeWeights: { single: 1 },
      knowledgePointWeights: { 马克思主义基本原理: 1 },
    });
    expect(paper.questions).toHaveLength(3);
    expect(paper.totalScore).toBe(100);
    expect(paper.difficultyDistribution).toEqual({ easy: 1, medium: 1, hard: 1 });
  });

  it('identifies low-quality questions', () => {
    const service = new QuestionBankGovernanceService();
    service.register({
      ...baseQuestion('weak', 'easy'),
      title: '过短',
      knowledgePoints: [],
      explanation: '简略',
      options: [{ id: 'only', content: '唯一选项', correct: true }],
    });
    const quality = service.assessQuality('weak');
    expect(quality.score).toBeLessThan(60);
    expect(quality.issues.length).toBeGreaterThanOrEqual(3);
  });
});

describe('AssessmentPlanningService', () => {
  it('detects learner schedule conflicts and readiness blockers', () => {
    const service = new AssessmentPlanningService();
    const windows = [
      {
        id: 'midterm',
        courseId: 'course-1',
        kind: 'midterm' as const,
        startAt: '2026-06-15T08:00:00.000Z',
        endAt: '2026-06-15T10:00:00.000Z',
        durationMinutes: 60,
        maxAttempts: 1,
        passScore: 60,
        participantIds: ['learner-1'],
      },
      {
        id: 'chapter',
        courseId: 'course-1',
        kind: 'chapter' as const,
        startAt: '2026-06-15T09:00:00.000Z',
        endAt: '2026-06-15T11:00:00.000Z',
        durationMinutes: 45,
        maxAttempts: 2,
        passScore: 60,
        participantIds: ['learner-1'],
      },
    ];
    const plan = service.buildCohortPlan(windows, [{
      learnerId: 'learner-1',
      state: 'at-risk',
      completedChapters: 3,
      requiredChapters: 10,
      practiceAccuracy: 0.4,
      attendanceRate: 0.8,
      integrityRisk: 20,
    }]);
    expect(plan.conflicts).toHaveLength(1);
    expect(plan.readinessSummary.blocked).toBe(2);
    expect(plan.assignments[0].blockers).toContain('前置章节完成率不足70%');
  });

  it('creates staggered starts for large cohorts', () => {
    const service = new AssessmentPlanningService();
    const starts = service.staggerWindow({
      id: 'final',
      courseId: 'course-1',
      kind: 'final',
      startAt: '2026-06-20T08:00:00.000Z',
      endAt: '2026-06-20T12:00:00.000Z',
      durationMinutes: 90,
      maxAttempts: 1,
      passScore: 60,
      participantIds: ['l1', 'l2', 'l3', 'l4', 'l5'],
    }, 2, 10);
    expect(starts[0].startAt).toBe(starts[1].startAt);
    expect(starts[2].startAt).not.toBe(starts[1].startAt);
  });
});
