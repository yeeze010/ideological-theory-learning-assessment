export type LearningEventType =
  | 'chapter_opened'
  | 'video_progress'
  | 'reading_progress'
  | 'discussion_posted'
  | 'quiz_submitted'
  | 'assignment_submitted'
  | 'exam_submitted';

export interface LearningEvent {
  id: string;
  studentId: string;
  courseId: string;
  chapterId: string;
  type: LearningEventType;
  occurredAt: string;
  progress?: number;
  score?: number;
  durationMinutes?: number;
  metadata?: Record<string, string | number | boolean>;
}

export interface LearningRequirement {
  chapterId: string;
  minimumVideoProgress: number;
  minimumReadingProgress: number;
  minimumQuizScore: number;
  minimumStudyMinutes: number;
  requireDiscussion: boolean;
  weight: number;
}

export interface ChapterAssessment {
  chapterId: string;
  videoProgress: number;
  readingProgress: number;
  quizScore: number;
  studyMinutes: number;
  discussionCompleted: boolean;
  completionRate: number;
  passed: boolean;
  missingRequirements: string[];
}

export interface CourseAssessment {
  studentId: string;
  courseId: string;
  completionRate: number;
  passedChapters: number;
  totalChapters: number;
  studyMinutes: number;
  averageQuizScore: number;
  engagementScore: number;
  status: 'not_started' | 'learning' | 'at_risk' | 'completed';
  chapters: ChapterAssessment[];
  recommendations: string[];
}

export interface EvaluationRule {
  id: string;
  name: string;
  category: 'learning' | 'exam' | 'practice' | 'engagement';
  weight: number;
  minimumScore: number;
  enabled: boolean;
}

export interface EvaluationInput {
  learningScore: number;
  examScore: number;
  practiceScore: number;
  engagementScore: number;
}

export interface EvaluationResult {
  totalScore: number;
  grade: '优秀' | '良好' | '合格' | '不合格';
  passed: boolean;
  categoryScores: Record<string, number>;
  failedRules: string[];
  explanation: string[];
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function average(values: number[]): number {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function maxOf(events: LearningEvent[], selector: (event: LearningEvent) => number): number {
  return events.reduce((max, event) => Math.max(max, selector(event)), 0);
}

export class LearningGovernanceService {
  assessCourse(
    studentId: string,
    courseId: string,
    requirements: LearningRequirement[],
    events: LearningEvent[],
  ): CourseAssessment {
    const studentEvents = events.filter((event) => {
      return event.studentId === studentId && event.courseId === courseId;
    });
    const chapters = requirements.map((requirement) => {
      return this.assessChapter(requirement, studentEvents.filter((event) => {
        return event.chapterId === requirement.chapterId;
      }));
    });
    const studyMinutes = studentEvents.reduce((sum, event) => {
      return sum + (event.durationMinutes ?? 0);
    }, 0);
    const quizScores = studentEvents
      .filter((event) => event.type === 'quiz_submitted')
      .map((event) => event.score ?? 0);
    const passedChapters = chapters.filter((chapter) => chapter.passed).length;
    const weightTotal = requirements.reduce((sum, requirement) => sum + requirement.weight, 0);
    const weightedCompletion = chapters.reduce((sum, chapter, index) => {
      return sum + chapter.completionRate * requirements[index].weight;
    }, 0);
    const completionRate = weightTotal ? weightedCompletion / weightTotal : 0;
    const engagementScore = this.engagementScore(studentEvents, requirements.length);
    const status = this.resolveStatus(studentEvents.length, completionRate, passedChapters, chapters.length);
    return {
      studentId,
      courseId,
      completionRate: Math.round(completionRate),
      passedChapters,
      totalChapters: chapters.length,
      studyMinutes,
      averageQuizScore: Math.round(average(quizScores)),
      engagementScore,
      status,
      chapters,
      recommendations: this.recommendations(chapters, engagementScore, studyMinutes),
    };
  }

  evaluate(input: EvaluationInput, rules: EvaluationRule[]): EvaluationResult {
    const source: Record<EvaluationRule['category'], number> = {
      learning: clamp(input.learningScore),
      exam: clamp(input.examScore),
      practice: clamp(input.practiceScore),
      engagement: clamp(input.engagementScore),
    };
    const active = rules.filter((rule) => rule.enabled);
    const totalWeight = active.reduce((sum, rule) => sum + rule.weight, 0);
    const totalScore = totalWeight
      ? active.reduce((sum, rule) => sum + source[rule.category] * rule.weight, 0) / totalWeight
      : 0;
    const failedRules = active
      .filter((rule) => source[rule.category] < rule.minimumScore)
      .map((rule) => rule.name);
    const rounded = Math.round(totalScore * 10) / 10;
    return {
      totalScore: rounded,
      grade: this.grade(rounded),
      passed: rounded >= 60 && failedRules.length === 0,
      categoryScores: source,
      failedRules,
      explanation: active.map((rule) => {
        const value = source[rule.category];
        return `${rule.name}: ${value} × ${rule.weight}%`;
      }),
    };
  }

  private assessChapter(requirement: LearningRequirement, events: LearningEvent[]): ChapterAssessment {
    const videoProgress = maxOf(
      events.filter((event) => event.type === 'video_progress'),
      (event) => event.progress ?? 0,
    );
    const readingProgress = maxOf(
      events.filter((event) => event.type === 'reading_progress'),
      (event) => event.progress ?? 0,
    );
    const quizScore = maxOf(
      events.filter((event) => event.type === 'quiz_submitted'),
      (event) => event.score ?? 0,
    );
    const studyMinutes = events.reduce((sum, event) => sum + (event.durationMinutes ?? 0), 0);
    const discussionCompleted = events.some((event) => event.type === 'discussion_posted');
    const checks = [
      videoProgress >= requirement.minimumVideoProgress,
      readingProgress >= requirement.minimumReadingProgress,
      quizScore >= requirement.minimumQuizScore,
      studyMinutes >= requirement.minimumStudyMinutes,
      !requirement.requireDiscussion || discussionCompleted,
    ];
    const missingRequirements: string[] = [];
    if (!checks[0]) missingRequirements.push('视频学习进度不足');
    if (!checks[1]) missingRequirements.push('阅读学习进度不足');
    if (!checks[2]) missingRequirements.push('章节测验成绩不足');
    if (!checks[3]) missingRequirements.push('有效学习时长不足');
    if (!checks[4]) missingRequirements.push('未完成章节讨论');
    return {
      chapterId: requirement.chapterId,
      videoProgress,
      readingProgress,
      quizScore,
      studyMinutes,
      discussionCompleted,
      completionRate: Math.round((checks.filter(Boolean).length / checks.length) * 100),
      passed: checks.every(Boolean),
      missingRequirements,
    };
  }

  private engagementScore(events: LearningEvent[], chapterCount: number): number {
    if (!events.length) return 0;
    const activeDays = new Set(events.map((event) => event.occurredAt.slice(0, 10))).size;
    const discussions = events.filter((event) => event.type === 'discussion_posted').length;
    const submissions = events.filter((event) => {
      return ['quiz_submitted', 'assignment_submitted', 'exam_submitted'].includes(event.type);
    }).length;
    const coverage = new Set(events.map((event) => event.chapterId)).size;
    return Math.round(clamp(
      activeDays * 5
      + discussions * 8
      + submissions * 6
      + (chapterCount ? coverage / chapterCount : 0) * 35,
    ));
  }

  private resolveStatus(
    eventCount: number,
    completionRate: number,
    passedChapters: number,
    totalChapters: number,
  ): CourseAssessment['status'] {
    if (!eventCount) return 'not_started';
    if (totalChapters > 0 && passedChapters === totalChapters) return 'completed';
    if (completionRate < 45) return 'at_risk';
    return 'learning';
  }

  private recommendations(chapters: ChapterAssessment[], engagementScore: number, studyMinutes: number): string[] {
    const result: string[] = [];
    const incomplete = chapters.filter((chapter) => !chapter.passed);
    if (incomplete.length) result.push(`优先补齐${incomplete.length}个未达标章节`);
    if (engagementScore < 60) result.push('增加讨论、测验和阶段提交，提高学习参与度');
    if (studyMinutes < chapters.length * 30) result.push('学习时长偏低，建议制定分章节学习计划');
    if (!result.length) result.push('当前学习状态良好，建议保持节奏并准备综合考核');
    return result;
  }

  private grade(score: number): EvaluationResult['grade'] {
    if (score >= 90) return '优秀';
    if (score >= 80) return '良好';
    if (score >= 60) return '合格';
    return '不合格';
  }
}
