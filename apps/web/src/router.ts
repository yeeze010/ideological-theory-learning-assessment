import { createRouter, createWebHistory } from "vue-router";
import { getToken } from "@/api/client";
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
import type { RoleCode, UserProfile } from "@assessment/shared";

const readProfile = () => JSON.parse(localStorage.getItem("assessment_profile") ?? "null") as UserProfile | null;
const canAccess = (roles: RoleCode[] | undefined, role: RoleCode | undefined) => !roles?.length || Boolean(role && roles.includes(role));

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/login", component: LoginView },
    { path: "/", redirect: "/dashboard" },
    { path: "/dashboard", component: DashboardView },
    { path: "/profile", component: LearningProfileView },
    { path: "/courses", component: CoursesView },
    { path: "/records", component: WorkflowView, props: { mode: "records" } },
    { path: "/questions", component: QuestionsView, meta: { roles: ["platform_admin", "org_admin", "course_admin", "question_admin"] } },
    { path: "/exams", component: ExamsView },
    { path: "/exams/:id/attempt", component: ExamAttemptView, meta: { roles: ["learner"] } },
    { path: "/marking", component: WorkflowView, props: { mode: "marking" }, meta: { roles: ["platform_admin", "org_admin", "course_admin", "supervisor"] } },
    { path: "/reports", component: ReportsView, meta: { roles: ["platform_admin", "org_admin", "course_admin", "supervisor", "auditor"] } },
    { path: "/acceptance", component: AcceptanceView, meta: { roles: ["platform_admin", "org_admin", "auditor"] } }
  ]
});

router.beforeEach((to) => {
  if (to.path !== "/login" && !getToken()) return "/login";
  if (to.path === "/login" && getToken()) return "/dashboard";
  const profile = readProfile();
  if (to.path !== "/login" && !canAccess(to.meta.roles as RoleCode[] | undefined, profile?.role)) {
    return "/dashboard";
  }
  return true;
});
