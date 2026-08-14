export interface LearnerAnswerResult {
  learnerId: string;
  questionId: string;
  knowledgePoints: string[];
  score: number;
  maximumScore: number;
  answeredAt: string;
  durationSeconds: number;
}

export interface KnowledgeDiagnostic {
  knowledgePoint: string;
  accuracy: number;
  averageDurationSeconds: number;
  learnerCount: number;
  level: 'mastered' | 'developing' | 'weak';
}

export class AssessmentDiagnosticsService {
  diagnose(results: LearnerAnswerResult[]): KnowledgeDiagnostic[] {
    const groups = new Map<string, LearnerAnswerResult[]>();
    results.forEach((result) => result.knowledgePoints.forEach((point) => {
      groups.set(point, [...(groups.get(point) ?? []), result]);
    }));
    return [...groups.entries()].map(([knowledgePoint, items]) => {
      const maximum = items.reduce((sum, item) => sum + item.maximumScore, 0);
      const accuracy = maximum === 0 ? 0 : items.reduce((sum, item) => sum + item.score, 0) / maximum;
      const level: KnowledgeDiagnostic['level'] = accuracy >= 0.8
        ? 'mastered'
        : accuracy >= 0.6
          ? 'developing'
          : 'weak';
      return {
        knowledgePoint,
        accuracy,
        averageDurationSeconds: items.reduce((sum, item) => sum + item.durationSeconds, 0) / items.length,
        learnerCount: new Set(items.map((item) => item.learnerId)).size,
        level,
      };
    }).sort((left, right) => left.accuracy - right.accuracy);
  }

  learnerProfile(learnerId: string, results: LearnerAnswerResult[]) {
    const learnerResults = results.filter((result) => result.learnerId === learnerId);
    const diagnostics = this.diagnose(learnerResults);
    const total = learnerResults.reduce((sum, result) => sum + result.maximumScore, 0);
    const earned = learnerResults.reduce((sum, result) => sum + result.score, 0);
    return {
      learnerId,
      accuracy: total === 0 ? 0 : earned / total,
      diagnostics,
      strengths: diagnostics.filter((item) => item.level === 'mastered').map((item) => item.knowledgePoint),
      weaknesses: diagnostics.filter((item) => item.level === 'weak').map((item) => item.knowledgePoint),
      recommendations: diagnostics
        .filter((item) => item.level !== 'mastered')
        .map((item) => `复习“${item.knowledgePoint}”并完成针对性练习`),
    };
  }

  cohortInterventions(results: LearnerAnswerResult[]) {
    const diagnostics = this.diagnose(results);
    return diagnostics.filter((item) => item.level !== 'mastered').map((item) => ({
      knowledgePoint: item.knowledgePoint,
      priority: item.level === 'weak' ? 'high' : 'normal',
      action: item.level === 'weak' ? '安排专题讲解和补测' : '推送拓展案例与巩固练习',
      affectedLearners: item.learnerCount,
    }));
  }

  detectSuspiciousPatterns(results: LearnerAnswerResult[]) {
    return results.filter((result) => result.durationSeconds < 3 && result.score === result.maximumScore).map((result) => ({
      learnerId: result.learnerId,
      questionId: result.questionId,
      reason: '极短时间内获得满分',
      severity: 'warning',
      answeredAt: result.answeredAt,
    }));
  }

  compareAttempts(previous: LearnerAnswerResult[], current: LearnerAnswerResult[]) {
    const previousByLearner = this.groupByLearner(previous);
    const currentByLearner = this.groupByLearner(current);
    return [...currentByLearner.entries()].map(([learnerId, currentResults]) => {
      const earlier = previousByLearner.get(learnerId) ?? [];
      const earlierScore = this.accuracy(earlier);
      const currentScore = this.accuracy(currentResults);
      return {
        learnerId,
        previousAccuracy: earlierScore,
        currentAccuracy: currentScore,
        improvement: currentScore - earlierScore,
        status: currentScore - earlierScore >= 0.1
          ? 'improved'
          : currentScore < earlierScore
            ? 'declined'
            : 'stable',
      };
    }).sort((left, right) => left.improvement - right.improvement);
  }

  questionDiagnostics(results: LearnerAnswerResult[]) {
    const groups = new Map<string, LearnerAnswerResult[]>();
    results.forEach((result) => groups.set(result.questionId, [...(groups.get(result.questionId) ?? []), result]));
    return [...groups.entries()].map(([questionId, items]) => {
      const accuracy = this.accuracy(items);
      const durations = items.map((item) => item.durationSeconds);
      const averageDurationSeconds = durations.reduce((sum, value) => sum + value, 0) / durations.length;
      const fastCorrect = items.filter((item) =>
        item.durationSeconds < averageDurationSeconds * 0.25 && item.score === item.maximumScore,
      ).length;
      return {
        questionId,
        attempts: items.length,
        accuracy,
        averageDurationSeconds,
        fastCorrect,
        recommendation: accuracy > 0.95
          ? '题目可能过易，建议提高区分度'
          : accuracy < 0.2
            ? '题目可能过难或表述不清，建议复核'
            : '题目表现处于合理区间',
      };
    }).sort((left, right) => left.accuracy - right.accuracy);
  }

  buildTeachingBrief(results: LearnerAnswerResult[]) {
    const diagnostics = this.diagnose(results);
    const learners = [...new Set(results.map((result) => result.learnerId))];
    const profiles = learners.map((learnerId) => this.learnerProfile(learnerId, results));
    const atRisk = profiles.filter((profile) => profile.accuracy < 0.6);
    return {
      learnerCount: learners.length,
      resultCount: results.length,
      cohortAccuracy: this.accuracy(results),
      weakKnowledgePoints: diagnostics
        .filter((diagnostic) => diagnostic.level === 'weak')
        .map((diagnostic) => diagnostic.knowledgePoint),
      atRiskLearners: atRisk.map((profile) => profile.learnerId),
      interventions: this.cohortInterventions(results),
      suspiciousPatterns: this.detectSuspiciousPatterns(results),
    };
  }

  private accuracy(results: LearnerAnswerResult[]): number {
    const maximum = results.reduce((sum, result) => sum + result.maximumScore, 0);
    return maximum === 0 ? 0 : results.reduce((sum, result) => sum + result.score, 0) / maximum;
  }

  private groupByLearner(results: LearnerAnswerResult[]): Map<string, LearnerAnswerResult[]> {
    const groups = new Map<string, LearnerAnswerResult[]>();
    results.forEach((result) => groups.set(result.learnerId, [...(groups.get(result.learnerId) ?? []), result]));
    return groups;
  }

  buildRemediationGroups(results: LearnerAnswerResult[], maximumGroupSize = 8) {
    const profiles = [...new Set(results.map((result) => result.learnerId))]
      .map((learnerId) => this.learnerProfile(learnerId, results));
    const byWeakness = new Map<string, string[]>();
    profiles.forEach((profile) => profile.weaknesses.forEach((weakness) => {
      byWeakness.set(weakness, [...(byWeakness.get(weakness) ?? []), profile.learnerId]);
    }));
    return [...byWeakness.entries()].flatMap(([knowledgePoint, learnerIds]) => {
      const groups = [];
      for (let index = 0; index < learnerIds.length; index += maximumGroupSize) {
        const members = learnerIds.slice(index, index + maximumGroupSize);
        groups.push({
          id: `${knowledgePoint}-${Math.floor(index / maximumGroupSize) + 1}`,
          knowledgePoint,
          learnerIds: members,
          activity: '专题讲解、案例讨论与针对性补测',
          successCriterion: '小组成员补测正确率达到80%',
        });
      }
      return groups;
    });
  }

  completionHeatmap(results: LearnerAnswerResult[]) {
    const cells = new Map<string, number>();
    results.forEach((result) => {
      const hour = new Date(result.answeredAt).getHours();
      const period = hour < 8 ? '清晨' : hour < 12 ? '上午' : hour < 18 ? '下午' : '晚间';
      result.knowledgePoints.forEach((point) => {
        const key = `${point}|${period}`;
        cells.set(key, (cells.get(key) ?? 0) + 1);
      });
    });
    return [...cells.entries()].map(([key, attempts]) => {
      const [knowledgePoint, period] = key.split('|');
      return { knowledgePoint, period, attempts };
    }).sort((left, right) => right.attempts - left.attempts);
  }

  unansweredLearners(expectedLearnerIds: string[], results: LearnerAnswerResult[]) {
    const answered = new Set(results.map((result) => result.learnerId));
    return expectedLearnerIds
      .filter((learnerId) => !answered.has(learnerId))
      .map((learnerId) => ({
        learnerId,
        action: '发送考核提醒并确认未作答原因',
      }));
  }

  buildEvidenceDigest(results: LearnerAnswerResult[]) {
    const learners = new Set(results.map((result) => result.learnerId));
    const questions = new Set(results.map((result) => result.questionId));
    const earliest = [...results].sort((left, right) => left.answeredAt.localeCompare(right.answeredAt))[0];
    const latest = [...results].sort((left, right) => right.answeredAt.localeCompare(left.answeredAt))[0];
    return {
      learnerCount: learners.size,
      questionCount: questions.size,
      answerCount: results.length,
      earliestAnsweredAt: earliest?.answeredAt ?? null,
      latestAnsweredAt: latest?.answeredAt ?? null,
      cohortAccuracy: this.accuracy(results),
      traceable: results.every((result) => Boolean(result.learnerId && result.questionId && result.answeredAt)),
    };
  }

  learningPathRecommendations(learnerId: string, results: LearnerAnswerResult[]) {
    const profile = this.learnerProfile(learnerId, results);
    return profile.diagnostics.map((diagnostic, index) => ({
      order: index + 1,
      knowledgePoint: diagnostic.knowledgePoint,
      currentLevel: diagnostic.level,
      targetAccuracy: diagnostic.level === 'weak' ? 0.7 : 0.85,
      activity: diagnostic.level === 'weak'
        ? '先学习基础讲解，再完成分层练习与补测'
        : diagnostic.level === 'developing'
          ? '完成案例分析与综合练习'
          : '进入拓展学习和同伴辅导',
      evidence: `当前正确率${(diagnostic.accuracy * 100).toFixed(1)}%`,
    }));
  }

  completionRate(expectedLearnerIds: string[], results: LearnerAnswerResult[]) {
    if (expectedLearnerIds.length === 0) return 1;
    const answered = new Set(results.map((result) => result.learnerId));
    return expectedLearnerIds.filter((learnerId) => answered.has(learnerId)).length / expectedLearnerIds.length;
  }

  evidenceIsComplete(result: LearnerAnswerResult) {
    return Boolean(
      result.learnerId
      && result.questionId
      && result.answeredAt
      && result.maximumScore > 0
      && result.durationSeconds >= 0,
    );
  }
}
