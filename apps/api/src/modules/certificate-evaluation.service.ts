export interface CertificateRequirement {
  id: string;
  name: string;
  type: 'score' | 'course_completion' | 'study_minutes' | 'practice' | 'integrity';
  threshold: number;
  required: boolean;
}

export interface CertificateCandidate {
  studentId: string;
  studentName: string;
  programId: string;
  programName: string;
  totalScore: number;
  courseCompletionRate: number;
  studyMinutes: number;
  practiceScore: number;
  integrityScore: number;
}

export interface CertificateDecision {
  eligible: boolean;
  candidate: CertificateCandidate;
  passedRequirements: string[];
  failedRequirements: string[];
  warnings: string[];
  certificateNumber?: string;
}

export interface ClassEvaluation {
  classId: string;
  studentCount: number;
  eligibleCount: number;
  eligibilityRate: number;
  averageScore: number;
  averageCompletionRate: number;
  excellentCount: number;
  atRiskStudents: string[];
  recommendations: string[];
}

export class CertificateEvaluationService {
  decide(candidate: CertificateCandidate, requirements: CertificateRequirement[]): CertificateDecision {
    const passedRequirements: string[] = [];
    const failedRequirements: string[] = [];
    const warnings: string[] = [];
    for (const requirement of requirements) {
      const value = this.value(candidate, requirement.type);
      if (value >= requirement.threshold) {
        passedRequirements.push(requirement.name);
      } else if (requirement.required) {
        failedRequirements.push(`${requirement.name}：${value} < ${requirement.threshold}`);
      } else {
        warnings.push(`${requirement.name}未达到建议值`);
      }
    }
    const eligible = failedRequirements.length === 0;
    return {
      eligible,
      candidate,
      passedRequirements,
      failedRequirements,
      warnings,
      certificateNumber: eligible ? this.number(candidate) : undefined,
    };
  }

  evaluateClass(
    classId: string,
    candidates: CertificateCandidate[],
    requirements: CertificateRequirement[],
  ): ClassEvaluation {
    const decisions = candidates.map((candidate) => this.decide(candidate, requirements));
    const eligible = decisions.filter((decision) => decision.eligible);
    const averageScore = this.average(candidates.map((candidate) => candidate.totalScore));
    const averageCompletionRate = this.average(candidates.map((candidate) => candidate.courseCompletionRate));
    const atRiskStudents = decisions
      .filter((decision) => !decision.eligible)
      .map((decision) => decision.candidate.studentId);
    const recommendations: string[] = [];
    if (averageCompletionRate < 80) recommendations.push('班级整体课程完成率偏低，建议开展学习进度督导');
    if (averageScore < 75) recommendations.push('班级综合成绩偏低，建议组织专题辅导和补测');
    if (atRiskStudents.length) recommendations.push(`对${atRiskStudents.length}名未达标学生制定个性化改进计划`);
    if (!recommendations.length) recommendations.push('班级整体达标情况良好，建议沉淀优秀学习案例');
    return {
      classId,
      studentCount: candidates.length,
      eligibleCount: eligible.length,
      eligibilityRate: candidates.length ? Math.round((eligible.length / candidates.length) * 100) : 0,
      averageScore,
      averageCompletionRate,
      excellentCount: candidates.filter((candidate) => candidate.totalScore >= 90).length,
      atRiskStudents,
      recommendations,
    };
  }

  defaultRequirements(): CertificateRequirement[] {
    return [
      { id: 'score', name: '综合评价成绩', type: 'score', threshold: 60, required: true },
      { id: 'completion', name: '课程完成率', type: 'course_completion', threshold: 100, required: true },
      { id: 'study', name: '有效学习时长', type: 'study_minutes', threshold: 600, required: true },
      { id: 'practice', name: '实践活动评价', type: 'practice', threshold: 60, required: true },
      { id: 'integrity', name: '考试诚信评分', type: 'integrity', threshold: 70, required: true },
    ];
  }

  private value(candidate: CertificateCandidate, type: CertificateRequirement['type']): number {
    if (type === 'score') return candidate.totalScore;
    if (type === 'course_completion') return candidate.courseCompletionRate;
    if (type === 'study_minutes') return candidate.studyMinutes;
    if (type === 'practice') return candidate.practiceScore;
    return candidate.integrityScore;
  }

  private number(candidate: CertificateCandidate): string {
    const year = new Date().getFullYear();
    const student = candidate.studentId.replace(/[^a-zA-Z0-9]/g, '').slice(-8).padStart(8, '0');
    const program = candidate.programId.replace(/[^a-zA-Z0-9]/g, '').slice(-6).padStart(6, '0');
    return `SZ-${year}-${program}-${student}`.toUpperCase();
  }

  private average(values: number[]): number {
    if (!values.length) return 0;
    return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
  }
}
