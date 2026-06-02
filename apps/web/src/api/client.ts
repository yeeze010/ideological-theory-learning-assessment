import type {
  CourseSummary,
  DashboardOverview,
  ExamEntry,
  ExamPlanSummary,
  ExamResult,
  QuestionSummary,
  UserProfile
} from "@assessment/shared";

const API_BASE = import.meta.env.VITE_API_BASE ?? "/api";

interface LoginResponse {
  token: string;
  profile: UserProfile;
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
    const message = await response.text();
    throw new Error(message || `请求失败：${response.status}`);
  }
  return response.json() as Promise<T>;
}

export const api = {
  login(username: string, password: string) {
    return request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password })
    });
  },
  overview() {
    return request<DashboardOverview>("/dashboard/overview");
  },
  courses() {
    return request<CourseSummary[]>("/courses");
  },
  questions() {
    return request<QuestionSummary[]>("/questions");
  },
  exams() {
    return request<ExamPlanSummary[]>("/exam-plans");
  },
  examEntry(examId: string) {
    return request<ExamEntry>(`/exam-plans/${examId}/entry`);
  },
  submitExam(attemptId: string, answers: Record<string, string[]>) {
    return request<ExamResult>(`/exam-attempts/${attemptId}/submit`, {
      method: "POST",
      body: JSON.stringify({ answers })
    });
  }
};
