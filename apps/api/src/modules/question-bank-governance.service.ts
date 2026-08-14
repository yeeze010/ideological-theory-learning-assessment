export type QuestionType = 'single' | 'multiple' | 'judge' | 'short-answer';
export type QuestionStatus = 'draft' | 'reviewing' | 'published' | 'retired';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface QuestionOption {
  id: string;
  content: string;
  correct: boolean;
}

export interface Question {
  id: string;
  title: string;
  type: QuestionType;
  difficulty: Difficulty;
  knowledgePoints: string[];
  options: QuestionOption[];
  referenceAnswer?: string;
  explanation: string;
  status: QuestionStatus;
  version: number;
  usageCount: number;
  correctCount: number;
  discrimination: number;
  authorId: string;
  reviewerId?: string;
  updatedAt: string;
}

export interface QuestionReview {
  questionId: string;
  reviewerId: string;
  approved: boolean;
  comments: string[];
  reviewedAt: string;
}

export interface PaperBlueprint {
  totalQuestions: number;
  difficultyWeights: Record<Difficulty, number>;
  typeWeights: Partial<Record<QuestionType, number>>;
  knowledgePointWeights: Record<string, number>;
  excludeRecentlyUsed?: boolean;
}

export interface PaperQuestion {
  questionId: string;
  score: number;
  order: number;
}

export interface GeneratedPaper {
  questions: PaperQuestion[];
  totalScore: number;
  difficultyDistribution: Record<Difficulty, number>;
  knowledgeCoverage: Record<string, number>;
  warnings: string[];
}

export interface QualityReport {
  questionId: string;
  score: number;
  issues: string[];
  suggestions: string[];
}

const difficultyValue: Record<Difficulty, number> = {
  easy: 1,
  medium: 2,
  hard: 3,
};

function normalizeWeights<T extends string>(weights: Partial<Record<T, number>>): Record<T, number> {
  const entries = Object.entries(weights) as Array<[T, number]>;
  const total = entries.reduce((sum, [, value]) => sum + Math.max(value, 0), 0);
  if (total === 0) {
    return Object.fromEntries(entries.map(([key]) => [key, 0])) as Record<T, number>;
  }
  return Object.fromEntries(
    entries.map(([key, value]) => [key, Math.max(value, 0) / total]),
  ) as Record<T, number>;
}

function calculateAllocation<T extends string>(
  total: number,
  weights: Partial<Record<T, number>>,
): Partial<Record<T, number>> {
  const normalized = normalizeWeights(weights);
  const raw = (Object.entries(normalized) as Array<[T, number]>).map(([key, weight]) => ({
    key: key as T,
    exact: weight * total,
    count: Math.floor(weight * total),
  }));
  let remaining = total - raw.reduce((sum, item) => sum + item.count, 0);
  raw
    .sort((left, right) => (right.exact - right.count) - (left.exact - left.count))
    .forEach((item) => {
      if (remaining > 0) {
        item.count += 1;
        remaining -= 1;
      }
    });
  return Object.fromEntries(raw.map((item) => [item.key, item.count])) as Partial<Record<T, number>>;
}

export class QuestionBankGovernanceService {
  private readonly questions = new Map<string, Question>();

  register(question: Question): Question {
    this.assertQuestion(question);
    const existing = this.questions.get(question.id);
    const next = {
      ...question,
      version: existing ? existing.version + 1 : Math.max(question.version, 1),
      updatedAt: new Date().toISOString(),
    };
    this.questions.set(next.id, next);
    return next;
  }

  submitForReview(questionId: string): Question {
    return this.transition(questionId, 'reviewing', ['draft']);
  }

  completeReview(review: QuestionReview): Question {
    const question = this.requireQuestion(review.questionId);
    if (question.status !== 'reviewing') {
      throw new Error('Only reviewing questions can complete review');
    }
    if (review.approved && review.comments.length > 0) {
      throw new Error('Approved review cannot contain blocking comments');
    }
    const next: Question = {
      ...question,
      status: review.approved ? 'published' : 'draft',
      reviewerId: review.reviewerId,
      updatedAt: review.reviewedAt,
    };
    this.questions.set(next.id, next);
    return next;
  }

  retire(questionId: string): Question {
    return this.transition(questionId, 'retired', ['published']);
  }

  recordOutcome(questionId: string, correct: boolean): Question {
    const question = this.requireQuestion(questionId);
    const next: Question = {
      ...question,
      usageCount: question.usageCount + 1,
      correctCount: question.correctCount + (correct ? 1 : 0),
      updatedAt: new Date().toISOString(),
    };
    this.questions.set(next.id, next);
    return next;
  }

  assessQuality(questionId: string): QualityReport {
    const question = this.requireQuestion(questionId);
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    if (question.title.trim().length < 12) {
      score -= 15;
      issues.push('题干信息不足');
      suggestions.push('补充情境、限定条件或理论背景');
    }
    if (question.knowledgePoints.length === 0) {
      score -= 20;
      issues.push('未关联知识点');
      suggestions.push('至少关联一个课程知识点');
    }
    if (question.explanation.trim().length < 20) {
      score -= 15;
      issues.push('解析过于简略');
      suggestions.push('说明正确答案依据以及常见误区');
    }
    if (question.type === 'single' || question.type === 'multiple') {
      const correctOptions = question.options.filter((option) => option.correct);
      if (question.options.length < 3) {
        score -= 20;
        issues.push('选项数量不足');
      }
      if (question.type === 'single' && correctOptions.length !== 1) {
        score -= 30;
        issues.push('单选题必须且只能有一个正确选项');
      }
      if (question.type === 'multiple' && correctOptions.length < 2) {
        score -= 20;
        issues.push('多选题正确选项不足');
      }
    }
    if (question.usageCount >= 20) {
      const correctRate = question.correctCount / question.usageCount;
      if (correctRate > 0.95 || correctRate < 0.15) {
        score -= 15;
        issues.push('实测难度偏离合理区间');
        suggestions.push('复核题干、答案和难度标签');
      }
      if (question.discrimination < 0.2) {
        score -= 15;
        issues.push('区分度偏低');
        suggestions.push('提高干扰项质量或调整考核知识点');
      }
    }
    return { questionId, score: Math.max(score, 0), issues, suggestions };
  }

  generatePaper(blueprint: PaperBlueprint): GeneratedPaper {
    if (blueprint.totalQuestions <= 0) {
      throw new Error('Paper must contain at least one question');
    }
    const candidates = [...this.questions.values()]
      .filter((question) => question.status === 'published')
      .filter((question) => !blueprint.excludeRecentlyUsed || question.usageCount < 5)
      .sort((left, right) => this.rankCandidate(right) - this.rankCandidate(left));

    const difficultyTarget = calculateAllocation(blueprint.totalQuestions, blueprint.difficultyWeights);
    const typeTarget = calculateAllocation(blueprint.totalQuestions, blueprint.typeWeights);
    const selected: Question[] = [];
    const warnings: string[] = [];

    for (const difficulty of ['easy', 'medium', 'hard'] as Difficulty[]) {
      const needed = difficultyTarget[difficulty] ?? 0;
      this.takeCandidates(
        candidates,
        selected,
        needed,
        (question) => question.difficulty === difficulty,
      );
    }
    this.takeCandidates(candidates, selected, blueprint.totalQuestions - selected.length, () => true);

    if (selected.length < blueprint.totalQuestions) {
      warnings.push(`可用题目不足，目标${blueprint.totalQuestions}题，实际${selected.length}题`);
    }

    for (const [type, target] of Object.entries(typeTarget) as Array<[QuestionType, number]>) {
      const current = selected.filter((question) => question.type === type).length;
      if (current < target) {
        warnings.push(`${type}题型少于蓝图要求：目标${target}，实际${current}`);
      }
    }

    const knowledgeCoverage: Record<string, number> = {};
    selected.forEach((question) => {
      question.knowledgePoints.forEach((point) => {
        knowledgeCoverage[point] = (knowledgeCoverage[point] ?? 0) + 1;
      });
    });
    for (const [point, weight] of Object.entries(blueprint.knowledgePointWeights)) {
      const expected = Math.ceil(blueprint.totalQuestions * weight);
      if ((knowledgeCoverage[point] ?? 0) < expected) {
        warnings.push(`知识点“${point}”覆盖不足`);
      }
    }

    const perQuestion = selected.length > 0 ? 100 / selected.length : 0;
    const questions = selected.map((question, index) => ({
      questionId: question.id,
      score: Number(perQuestion.toFixed(2)),
      order: index + 1,
    }));
    const totalScore = questions.reduce((sum, question) => sum + question.score, 0);
    const difference = Number((100 - totalScore).toFixed(2));
    if (questions.length > 0) {
      questions[questions.length - 1].score += difference;
    }
    return {
      questions,
      totalScore: questions.reduce((sum, question) => sum + question.score, 0),
      difficultyDistribution: {
        easy: selected.filter((question) => question.difficulty === 'easy').length,
        medium: selected.filter((question) => question.difficulty === 'medium').length,
        hard: selected.filter((question) => question.difficulty === 'hard').length,
      },
      knowledgeCoverage,
      warnings,
    };
  }

  list(status?: QuestionStatus): Question[] {
    return [...this.questions.values()]
      .filter((question) => !status || question.status === status)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  private takeCandidates(
    candidates: Question[],
    selected: Question[],
    count: number,
    predicate: (question: Question) => boolean,
  ): void {
    if (count <= 0) return;
    for (const candidate of candidates) {
      if (selected.length >= candidates.length || count <= 0) break;
      if (selected.some((item) => item.id === candidate.id)) continue;
      if (!predicate(candidate)) continue;
      selected.push(candidate);
      count -= 1;
    }
  }

  private rankCandidate(question: Question): number {
    const quality = this.assessQuality(question.id).score;
    const freshness = Math.max(0, 20 - question.usageCount);
    const discrimination = Math.min(question.discrimination, 1) * 30;
    return quality + freshness + discrimination + difficultyValue[question.difficulty];
  }

  private transition(
    questionId: string,
    nextStatus: QuestionStatus,
    allowedStatuses: QuestionStatus[],
  ): Question {
    const question = this.requireQuestion(questionId);
    if (!allowedStatuses.includes(question.status)) {
      throw new Error(`Question cannot transition from ${question.status} to ${nextStatus}`);
    }
    const next = { ...question, status: nextStatus, updatedAt: new Date().toISOString() };
    this.questions.set(next.id, next);
    return next;
  }

  private requireQuestion(questionId: string): Question {
    const question = this.questions.get(questionId);
    if (!question) throw new Error(`Question ${questionId} does not exist`);
    return question;
  }

  private assertQuestion(question: Question): void {
    if (!question.id.trim() || !question.title.trim()) {
      throw new Error('Question id and title are required');
    }
    if (new Set(question.options.map((option) => option.id)).size !== question.options.length) {
      throw new Error('Option ids must be unique');
    }
    if (question.correctCount > question.usageCount) {
      throw new Error('Correct count cannot exceed usage count');
    }
  }
}
