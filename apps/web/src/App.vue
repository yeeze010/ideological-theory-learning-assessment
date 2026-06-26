<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { RoleCode } from "@assessment/shared";
import { useSessionStore } from "@/stores/session";

interface NavItem {
  path: string;
  label: string;
  code: string;
  roles?: RoleCode[];
}

const route = useRoute();
const router = useRouter();
const session = useSessionStore();

const groups: Array<{ label: string; items: NavItem[] }> = [
  { label: "总览", items: [{ path: "/dashboard", label: "学评总览", code: "01" }] },
  {
    label: "学生端",
    items: [
      { path: "/profile", label: "个人画像", code: "02", roles: ["learner"] },
      { path: "/courses", label: "学习任务与课程", code: "03" },
      { path: "/records", label: "学习记录", code: "04" }
    ]
  },
  {
    label: "教师端",
    items: [
      { path: "/questions", label: "题库与组卷", code: "05", roles: ["platform_admin", "course_admin"] },
      { path: "/exams", label: "考试安排", code: "06" },
      { path: "/marking", label: "阅卷与复核", code: "07", roles: ["platform_admin", "course_admin", "supervisor"] }
    ]
  },
  {
    label: "管理与督导",
    items: [
      { path: "/reports", label: "评价与统计", code: "08", roles: ["platform_admin", "course_admin", "supervisor"] },
      { path: "/acceptance", label: "治理验收", code: "09", roles: ["platform_admin"] }
    ]
  }
];

const visibleGroups = computed(() => {
  const role = session.profile?.role;
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.roles?.length || (role && item.roles.includes(role)))
    }))
    .filter((group) => group.items.length > 0);
});

const activeLabel = computed(
  () => groups.flatMap((group) => group.items).find((item) => item.path === route.path)?.label ?? "业务工作台"
);

function logout() {
  session.logout();
  void router.push("/login");
}
</script>

<template>
  <router-view v-if="$route.path === '/login'" />
  <div v-else class="product-shell">
    <a class="skip-link" href="#main-content">跳到主要内容</a>
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-mark">政</div>
        <div>
          <strong>思政学评</strong>
          <span>学习 · 考试 · 评价</span>
        </div>
      </div>
      <nav aria-label="主导航">
        <div v-for="group in visibleGroups" :key="group.label" class="nav-group">
          <label>{{ group.label }}</label>
          <router-link v-for="item in group.items" :key="item.path" :to="item.path" class="nav-link">
            <span>{{ item.code }}</span>{{ item.label }}
          </router-link>
        </div>
      </nav>
      <div class="side-footer">
        <span class="status-dot"></span>
        <div><strong>系统运行正常</strong><small>API 8211 · Web 5211</small></div>
      </div>
    </aside>
    <main class="main" id="main-content">
      <header class="topbar">
        <div><span class="folio">思政学评 / {{ activeLabel }}</span></div>
        <div class="top-actions">
          <button class="icon-button" aria-label="通知">通知 <b>3</b></button>
          <div class="identity">
            <strong>{{ session.profile?.name ?? "未登录" }}</strong>
            <span>{{ session.profile?.orgName ?? "请登录" }} · {{ session.profile?.role ?? "" }}</span>
          </div>
          <button class="text-button" @click="logout">退出</button>
        </div>
      </header>
      <section class="content"><router-view /></section>
    </main>
  </div>
</template>
