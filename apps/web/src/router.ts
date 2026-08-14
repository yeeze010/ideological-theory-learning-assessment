import { createRouter, createWebHistory } from "vue-router";
import DashboardView from "@/views/DashboardView.vue";
import LoginView from "@/views/LoginView.vue";
import CoursesView from "@/views/CoursesView.vue";
import QuestionsView from "@/views/QuestionsView.vue";
import ExamsView from "@/views/ExamsView.vue";
import ExamAttemptView from "@/views/ExamAttemptView.vue";
import ReportsView from "@/views/ReportsView.vue";
import WorkflowView from "@/views/WorkflowView.vue";
import AcceptanceView from "@/views/AcceptanceView.vue";
import LearningProfileView from "@/views/LearningProfileView.vue";
import ClassResultsView from "@/views/ClassResultsView.vue";
import { hasPermission, homePathForRole, type PermissionCode } from "@/auth/roles";
import { useSessionStore } from "@/stores/session";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/login", component: LoginView, meta: { public: true } },
    { path: "/", redirect: "/dashboard" },
    { path: "/dashboard", component: DashboardView, meta: { permission: "dashboard:view" } },
    { path: "/profile", component: LearningProfileView, meta: { permission: "profile:view" } },
    { path: "/courses", component: CoursesView, meta: { permission: "course:view" } },
    { path: "/records", component: WorkflowView, props: { mode: "records" }, meta: { permission: "record:view" } },
    { path: "/questions", component: QuestionsView, meta: { permission: "question:view" } },
    { path: "/exams", component: ExamsView, meta: { permission: "exam:view" } },
    { path: "/exams/:id/attempt", component: ExamAttemptView, meta: { permission: "exam:attempt" } },
    { path: "/marking", component: WorkflowView, props: { mode: "marking" }, meta: { permission: "review:view" } },
    { path: "/reports", component: ReportsView, meta: { permission: "report:view" } },
    { path: "/class-results", component: ClassResultsView, meta: { permission: "class-results:view" } },
    { path: "/acceptance", component: AcceptanceView, meta: { permission: "audit:view" } }
  ]
});

router.beforeEach(async (to) => {
  const session = useSessionStore();
  await session.restore();

  if (to.meta.public) {
    return session.profile ? homePathForRole(session.profile.role) : true;
  }
  if (!session.profile) {
    return { path: "/login", query: { redirect: to.fullPath } };
  }
  const permission = to.meta.permission as PermissionCode | undefined;
  if (!hasPermission(session.profile.role, permission)) {
    session.showPermissionDenied("当前角色无权访问该功能，已返回可用工作台。");
    return homePathForRole(session.profile.role);
  }
  return true;
});
