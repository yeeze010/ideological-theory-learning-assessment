export type RoleCode =
  | "platform_admin"
  | "org_admin"
  | "course_admin"
  | "question_admin"
  | "supervisor"
  | "learner"
  | "auditor";

export type CourseStatus = "draft" | "published" | "archived";
export type ExamStatus = "draft" | "published" | "running" | "closed";
export type QuestionType = "single" | "multiple" | "judge";

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  role: RoleCode;
  orgName: string;
}

export interface DashboardOverview {
  learnerCount: number;
  courseCount: number;
  examCount: number;
  passRate: number;
  completionRate: number;
  pendingReviews: number;
  riskAlerts: number;
}

export interface CourseSummary {
  id: string;
  title: string;
  category: string;
  status: CourseStatus;
  requiredMinutes: number;
  completionRate: number;
  learnerCount: number;
}

export interface QuestionSummary {
  id: string;
  bankName: string;
  type: QuestionType;
  difficulty: "easy" | "medium" | "hard";
  stem: string;
  score: number;
}

export interface ExamPlanSummary {
  id: string;
  title: string;
  courseTitle: string;
  status: ExamStatus;
  startAt: string;
  endAt: string;
  durationMinutes: number;
  passScore: number;
}

export interface ExamQuestion {
  id: string;
  type: QuestionType;
  stem: string;
  options: string[];
  score: number;
}

export interface ExamEntry {
  attemptId: string;
  exam: ExamPlanSummary;
  questions: ExamQuestion[];
}

export interface ExamResult {
  attemptId: string;
  totalScore: number;
  passed: boolean;
  submittedAt: string;
  details: Array<{
    questionId: string;
    score: number;
    correct: boolean;
  }>;
}
