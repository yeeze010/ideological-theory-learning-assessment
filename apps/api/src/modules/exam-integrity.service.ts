export type IntegrityEventType =
  | 'focus_lost'
  | 'copy_attempt'
  | 'paste_attempt'
  | 'fullscreen_exit'
  | 'camera_missing'
  | 'multiple_faces'
  | 'network_reconnect'
  | 'rapid_answer'
  | 'answer_changed';

export interface IntegrityEvent {
  id: string;
  attemptId: string;
  studentId: string;
  type: IntegrityEventType;
  occurredAt: string;
  durationSeconds?: number;
  questionId?: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface IntegrityRule {
  type: IntegrityEventType;
  score: number;
  maxOccurrences: number;
  blocker: boolean;
  description: string;
}

export interface IntegrityAssessment {
  attemptId: string;
  studentId: string;
  riskScore: number;
  riskLevel: '低' | '中' | '高' | '严重';
  requiresReview: boolean;
  blocked: boolean;
  eventCounts: Partial<Record<IntegrityEventType, number>>;
  reasons: string[];
  evidenceIds: string[];
}

export interface QuestionAnswer {
  questionId: string;
  answer: string | string[];
  correctAnswer: string | string[];
  score: number;
  type: 'single' | 'multiple' | 'judge' | 'short';
  keywords?: string[];
}

export interface AutoMarkResult {
  totalScore: number;
  maximumScore: number;
  detail: Array<{
    questionId: string;
    awardedScore: number;
    maximumScore: number;
    result: 'correct' | 'partial' | 'incorrect' | 'manual_review';
    explanation: string;
  }>;
  manualReviewQuestionIds: string[];
}

export class ExamIntegrityService {
  assess(events: IntegrityEvent[], rules: IntegrityRule[]): IntegrityAssessment {
    if (!events.length) {
      return {
        attemptId: '',
        studentId: '',
        riskScore: 0,
        riskLevel: '低',
        requiresReview: false,
        blocked: false,
        eventCounts: {},
        reasons: [],
        evidenceIds: [],
      };
    }
    const counts: Partial<Record<IntegrityEventType, number>> = {};
    const reasons: string[] = [];
    const evidenceIds: string[] = [];
    let score = 0;
    let blocked = false;
    for (const event of events) {
      counts[event.type] = (counts[event.type] ?? 0) + 1;
      const rule = rules.find((candidate) => candidate.type === event.type);
      if (!rule) continue;
      const occurrence = counts[event.type] ?? 0;
      if (occurrence <= rule.maxOccurrences) {
        score += rule.score;
        evidenceIds.push(event.id);
      }
      if (rule.blocker) blocked = true;
      reasons.push(`${rule.description}（第${occurrence}次）`);
    }
    const riskScore = Math.min(100, score);
    return {
      attemptId: events[0].attemptId,
      studentId: events[0].studentId,
      riskScore,
      riskLevel: this.level(riskScore),
      requiresReview: riskScore >= 35 || blocked,
      blocked,
      eventCounts: counts,
      reasons: [...new Set(reasons)],
      evidenceIds,
    };
  }

  autoMark(answers: QuestionAnswer[]): AutoMarkResult {
    const detail: AutoMarkResult['detail'] = [];
    const manualReviewQuestionIds: string[] = [];
    let totalScore = 0;
    let maximumScore = 0;
    for (const answer of answers) {
      maximumScore += answer.score;
      if (answer.type === 'short') {
        const result = this.markShortAnswer(answer);
        totalScore += result.score;
        detail.push({
          questionId: answer.questionId,
          awardedScore: result.score,
          maximumScore: answer.score,
          result: result.manual ? 'manual_review' : result.score === answer.score ? 'correct' : 'partial',
          explanation: result.explanation,
        });
        if (result.manual) manualReviewQuestionIds.push(answer.questionId);
        continue;
      }
      const actual = this.normalize(answer.answer);
      const expected = this.normalize(answer.correctAnswer);
      const correct = actual.length === expected.length && actual.every((value, index) => value === expected[index]);
      const awardedScore = correct ? answer.score : 0;
      totalScore += awardedScore;
      detail.push({
        questionId: answer.questionId,
        awardedScore,
        maximumScore: answer.score,
        result: correct ? 'correct' : 'incorrect',
        explanation: correct ? '答案匹配标准答案' : '答案与标准答案不一致',
      });
    }
    return {
      totalScore,
      maximumScore,
      detail,
      manualReviewQuestionIds,
    };
  }

  defaultRules(): IntegrityRule[] {
    return [
      { type: 'focus_lost', score: 8, maxOccurrences: 5, blocker: false, description: '考试窗口失去焦点' },
      { type: 'copy_attempt', score: 20, maxOccurrences: 2, blocker: false, description: '检测到复制行为' },
      { type: 'paste_attempt', score: 25, maxOccurrences: 2, blocker: false, description: '检测到粘贴行为' },
      { type: 'fullscreen_exit', score: 12, maxOccurrences: 3, blocker: false, description: '退出全屏考试模式' },
      { type: 'camera_missing', score: 30, maxOccurrences: 2, blocker: false, description: '监考摄像头不可用' },
      { type: 'multiple_faces', score: 50, maxOccurrences: 1, blocker: true, description: '画面出现多个人脸' },
      { type: 'network_reconnect', score: 5, maxOccurrences: 5, blocker: false, description: '网络中断后重连' },
      { type: 'rapid_answer', score: 10, maxOccurrences: 5, blocker: false, description: '答题速度异常' },
      { type: 'answer_changed', score: 2, maxOccurrences: 10, blocker: false, description: '答案频繁修改' },
    ];
  }

  private markShortAnswer(answer: QuestionAnswer): { score: number; manual: boolean; explanation: string } {
    const text = Array.isArray(answer.answer) ? answer.answer.join(' ') : answer.answer;
    const keywords = answer.keywords ?? [];
    if (!keywords.length) {
      return { score: 0, manual: true, explanation: '未配置关键词，需要人工阅卷' };
    }
    const hit = keywords.filter((keyword) => text.includes(keyword));
    const ratio = hit.length / keywords.length;
    const score = Math.round(answer.score * ratio * 10) / 10;
    return {
      score,
      manual: ratio > 0 && ratio < 1,
      explanation: `命中关键词${hit.length}/${keywords.length}`,
    };
  }

  private normalize(value: string | string[]): string[] {
    const list = Array.isArray(value) ? value : [value];
    return list.map((item) => item.trim().toLowerCase()).sort();
  }

  private level(score: number): IntegrityAssessment['riskLevel'] {
    if (score >= 80) return '严重';
    if (score >= 55) return '高';
    if (score >= 30) return '中';
    return '低';
  }
}
