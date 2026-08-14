import type {
  CourseSummary,
  DashboardOverview,
  ExamEntry,
  ExamPlanSummary,
  ExamResult,
  AuditLogItem,
  ClassResultSummary,
  LearningAlert,
  LearningIntervention,
  LearningProfile,
  LearningRecommendation,
  QuestionSummary,
  ReviewTask,
  RoleCode,
  UserProfile
} from "@assessment/shared";

const API_BASE = import.meta.env?.VITE_API_BASE ?? "/api";

interface LoginResponse {
  token: string;
  profile: UserProfile;
}

interface ApiHandlers {
  unauthorized?: () => void;
  forbidden?: (message: string) => void;
}

let handlers: ApiHandlers = {};

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function configureApiHandlers(nextHandlers: ApiHandlers) {
  handlers = nextHandlers;
}

export function getToken() {
  return localStorage.getItem("assessment_token");
}

export function setToken(token: string) {
  localStorage.setItem("assessment_token", token);
}

export function clearToken() {
  localStorage.removeItem("assessment_token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  const token = getToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });
  if (!response.ok) {
    const raw = await response.text();
    let message = raw || `请求失败：${response.status}`;
    try {
      const payload = JSON.parse(raw) as { message?: string | string[] };
      if (Array.isArray(payload.message)) message = payload.message.join("；");
      else if (payload.message) message = payload.message;
    } catch {
      // Non-JSON failures retain the response text.
    }
    if (response.status === 401) handlers.unauthorized?.();
    if (response.status === 403) handlers.forbidden?.(message);
    throw new ApiError(message, response.status);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const api = {
  login(role: RoleCode, username: string, password: string) {
    return request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ role, username, password })
    });
  },
  async me() {
    const data = await request<UserProfile | { profile: UserProfile }>("/auth/me");
    return "profile" in data ? data.profile : data;
  },
  overview() {
    return request<DashboardOverview>("/dashboard/overview");
  },
  courses() {
    return request<CourseSummary[]>("/courses");
  },
  createCourse(payload: { title: string; category: string; requiredMinutes: number }) {
    return request<CourseSummary>("/courses", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  publishCourse(id: string) {
    return request<CourseSummary>(`/courses/${id}/publish`, { method: "POST" });
  },
  questions() {
    return request<QuestionSummary[]>("/questions");
  },
  createQuestion(payload: { bankName: string; stem: string; options: string[]; answer: string[]; score: number }) {
    return request<QuestionSummary>("/questions", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  publishQuestion(id: string) {
    return request<QuestionSummary>(`/questions/${id}/publish`, { method: "POST" });
  },
  createExamPlan(payload: {
    courseId: string;
    title: string;
    questionIds: string[];
    durationMinutes: number;
    passScore: number;
    startAt: string;
    endAt: string;
  }) {
    return request<ExamPlanSummary>("/exam-plans", { method: "POST", body: JSON.stringify(payload) });
  },
  exams() {
    return request<ExamPlanSummary[]>("/exam-plans");
  },
  auditLogs() {
    return request<AuditLogItem[]>("/audit-logs");
  },
  examEntry(examId: string) {
    return request<ExamEntry>(`/exam-plans/${examId}/entry`);
  },
  submitExam(attemptId: string, answers: Record<string, string[]>) {
    return request<ExamResult>(`/exam-attempts/${attemptId}/submit`, {
      method: "POST",
      body: JSON.stringify({ answers })
    });
  },
  learningProfile() {
    return request<LearningProfile>("/learning/profile");
  },
  learningRecommendations() {
    return request<LearningRecommendation[]>("/learning/recommendations");
  },
  learningAlerts() {
    return request<LearningAlert[]>("/learning/alerts");
  },
  classResults() {
    return request<ClassResultSummary[]>("/learning/class-results");
  },
  createIntervention(payload: {
    learnerId: string;
    courseId?: string;
    sourceAttemptId?: string;
    title: string;
    knowledgePoint: string;
    reason: string;
    priority: "low" | "medium" | "high";
  }) {
    return request<LearningIntervention>("/learning/interventions", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  pendingReviews() {
    return request<ReviewTask[]>("/reviews/pending");
  },
  approveReview(id: string) {
    return request<ReviewTask>(`/reviews/${id}/approve`, {
      method: "POST"
    });
  }
};
