import { createRouter, createWebHistory } from "vue-router";
import { getToken } from "@/api/client";
import DashboardView from "@/views/DashboardView.vue";
import LoginView from "@/views/LoginView.vue";
import CoursesView from "@/views/CoursesView.vue";
import QuestionsView from "@/views/QuestionsView.vue";
import ExamsView from "@/views/ExamsView.vue";
import ExamAttemptView from "@/views/ExamAttemptView.vue";
import ReportsView from "@/views/ReportsView.vue";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/login", component: LoginView },
    { path: "/", redirect: "/dashboard" },
    { path: "/dashboard", component: DashboardView },
    { path: "/courses", component: CoursesView },
    { path: "/questions", component: QuestionsView },
    { path: "/exams", component: ExamsView },
    { path: "/exams/:id/attempt", component: ExamAttemptView },
    { path: "/reports", component: ReportsView }
  ]
});

router.beforeEach((to) => {
  if (to.path !== "/login" && !getToken()) {
    return "/login";
  }
  if (to.path === "/login" && getToken()) {
    return "/dashboard";
  }
  return true;
});
