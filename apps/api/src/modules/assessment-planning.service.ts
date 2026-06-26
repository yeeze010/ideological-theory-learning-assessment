export type AssessmentKind = 'chapter' | 'midterm' | 'final' | 'practice';
export type LearnerState = 'normal' | 'at-risk' | 'exempt';

export interface AssessmentWindow {
  id: string;
  courseId: string;
  kind: AssessmentKind;
  startAt: string;
  endAt: string;
  durationMinutes: number;
  maxAttempts: number;
  passScore: number;
  participantIds: string[];
}

export interface LearnerReadiness {
  learnerId: string;
  state: LearnerState;
  completedChapters: number;
  requiredChapters: number;
  practiceAccuracy: number;
  attendanceRate: number;
  integrityRisk: number;
}

export interface AssessmentAssignment {
  assessmentId: string;
  learnerId: string;
  assigned: boolean;
  recommendedStartAt: string;
  accommodations: string[];
  blockers: string[];
}

export interface ScheduleConflict {
  leftAssessmentId: string;
  rightAssessmentId: string;
  overlapMinutes: number;
  affectedLearners: string[];
  severity: 'warning' | 'blocking';
}

export interface CohortPlan {
  assignments: AssessmentAssignment[];
  conflicts: ScheduleConflict[];
  readinessSummary: {
    ready: number;
    conditional: number;
    blocked: number;
  };
  recommendations: string[];
}

function parseDate(value: string): Date {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new Error(`Invalid date: ${value}`);
  return parsed;
}

function overlapMinutes(left: AssessmentWindow, right: AssessmentWindow): number {
  const start = Math.max(parseDate(left.startAt).getTime(), parseDate(right.startAt).getTime());
  const end = Math.min(parseDate(left.endAt).getTime(), parseDate(right.endAt).getTime());
  return Math.max(0, Math.round((end - start) / 60_000));
}

export class AssessmentPlanningService {
  validateWindow(window: AssessmentWindow): string[] {
    const issues: string[] = [];
    const start = parseDate(window.startAt);
    const end = parseDate(window.endAt);
    const availableMinutes = (end.getTime() - start.getTime()) / 60_000;
    if (availableMinutes <= 0) issues.push('考核结束时间必须晚于开始时间');
    if (window.durationMinutes <= 0) issues.push('答题时长必须大于0');
    if (availableMinutes > 0 && window.durationMinutes > availableMinutes) {
      issues.push('答题时长不能超过开放时间窗口');
    }
    if (window.maxAttempts < 1) issues.push('至少允许一次作答');
    if (window.passScore < 0 || window.passScore > 100) issues.push('及格分数必须位于0到100');
    if (window.participantIds.length === 0) issues.push('考核未分配学员');
    if (new Set(window.participantIds).size !== window.participantIds.length) {
      issues.push('考核学员名单存在重复');
    }
    return issues;
  }

  detectConflicts(windows: AssessmentWindow[]): ScheduleConflict[] {
    const conflicts: ScheduleConflict[] = [];
    for (let leftIndex = 0; leftIndex < windows.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < windows.length; rightIndex += 1) {
        const left = windows[leftIndex];
        const right = windows[rightIndex];
        const overlap = overlapMinutes(left, right);
        if (overlap === 0) continue;
        const affected = left.participantIds.filter((id) => right.participantIds.includes(id));
        if (affected.length === 0) continue;
        conflicts.push({
          leftAssessmentId: left.id,
          rightAssessmentId: right.id,
          overlapMinutes: overlap,
          affectedLearners: affected,
          severity: overlap >= Math.min(left.durationMinutes, right.durationMinutes) ? 'blocking' : 'warning',
        });
      }
    }
    return conflicts.sort((left, right) => right.overlapMinutes - left.overlapMinutes);
  }

  assign(window: AssessmentWindow, readiness: LearnerReadiness): AssessmentAssignment {
    const blockers: string[] = [];
    const accommodations: string[] = [];
    const completionRate = readiness.requiredChapters === 0
      ? 1
      : readiness.completedChapters / readiness.requiredChapters;

    if (!window.participantIds.includes(readiness.learnerId)) {
      blockers.push('学员不在本次考核名单中');
    }
    if (readiness.state === 'exempt') blockers.push('学员处于免考状态');
    if (window.kind !== 'practice' && completionRate < 0.7) {
      blockers.push('前置章节完成率不足70%');
    }
    if (window.kind === 'final' && readiness.attendanceRate < 0.6) {
      blockers.push('课程出勤率不足60%');
    }
    if (readiness.integrityRisk >= 80) {
      blockers.push('诚信风险过高，需要人工复核后解锁');
    } else if (readiness.integrityRisk >= 50) {
      accommodations.push('启用增强监考模式');
    }
    if (readiness.state === 'at-risk') {
      accommodations.push('考前推送重点知识复习清单');
    }
    if (readiness.practiceAccuracy < 0.5) {
      accommodations.push('建议先完成适应性练习');
    }

    return {
      assessmentId: window.id,
      learnerId: readiness.learnerId,
      assigned: blockers.length === 0,
      recommendedStartAt: this.recommendStart(window, readiness),
      accommodations: [...new Set(accommodations)],
      blockers,
    };
  }

  buildCohortPlan(
    windows: AssessmentWindow[],
    readinessRecords: LearnerReadiness[],
  ): CohortPlan {
    windows.forEach((window) => {
      const issues = this.validateWindow(window);
      if (issues.length > 0) throw new Error(`${window.id}: ${issues.join('; ')}`);
    });
    const readinessById = new Map(readinessRecords.map((record) => [record.learnerId, record]));
    const assignments: AssessmentAssignment[] = [];
    for (const window of windows) {
      for (const learnerId of window.participantIds) {
        const readiness = readinessById.get(learnerId);
        if (!readiness) {
          assignments.push({
            assessmentId: window.id,
            learnerId,
            assigned: false,
            recommendedStartAt: window.startAt,
            accommodations: [],
            blockers: ['缺少学员考前准备度数据'],
          });
          continue;
        }
        assignments.push(this.assign(window, readiness));
      }
    }
    const ready = assignments.filter(
      (assignment) => assignment.assigned && assignment.accommodations.length === 0,
    ).length;
    const conditional = assignments.filter(
      (assignment) => assignment.assigned && assignment.accommodations.length > 0,
    ).length;
    const blocked = assignments.filter((assignment) => !assignment.assigned).length;
    const conflicts = this.detectConflicts(windows);
    const recommendations: string[] = [];
    if (blocked > 0) recommendations.push(`有${blocked}个考核分配需要教师复核`);
    if (conditional > 0) recommendations.push(`有${conditional}个分配需要个性化考前支持`);
    if (conflicts.some((conflict) => conflict.severity === 'blocking')) {
      recommendations.push('存在阻断级时间冲突，建议调整考核窗口');
    }
    if (windows.some((window) => window.kind === 'final' && window.maxAttempts > 1)) {
      recommendations.push('期末考核允许多次作答，请确认是否符合课程规则');
    }
    return {
      assignments,
      conflicts,
      readinessSummary: { ready, conditional, blocked },
      recommendations,
    };
  }

  staggerWindow(
    window: AssessmentWindow,
    batchSize: number,
    intervalMinutes: number,
  ): Array<{ learnerId: string; startAt: string }> {
    if (batchSize <= 0 || intervalMinutes < 0) {
      throw new Error('Batch size must be positive and interval cannot be negative');
    }
    const start = parseDate(window.startAt).getTime();
    return window.participantIds.map((learnerId, index) => ({
      learnerId,
      startAt: new Date(start + Math.floor(index / batchSize) * intervalMinutes * 60_000).toISOString(),
    }));
  }

  private recommendStart(window: AssessmentWindow, readiness: LearnerReadiness): string {
    const start = parseDate(window.startAt).getTime();
    const end = parseDate(window.endAt).getTime();
    const available = end - start;
    let ratio = 0.2;
    if (readiness.state === 'at-risk' || readiness.practiceAccuracy < 0.5) ratio = 0.1;
    if (readiness.integrityRisk >= 50) ratio = 0.5;
    return new Date(start + Math.round(available * ratio)).toISOString();
  }
}
