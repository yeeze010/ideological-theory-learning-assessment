<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { hasPermission, roleDefinition, type PermissionCode } from "@/auth/roles";
import { useSessionStore } from "@/stores/session";

interface NavItem {
  path: string;
  label: string;
  code: string;
  permission: PermissionCode;
}

const route = useRoute();
const router = useRouter();
const session = useSessionStore();

const groups: Array<{ label: string; items: NavItem[] }> = [
  {
    label: "总览",
    items: [{ path: "/dashboard", label: "学评总览", code: "01", permission: "dashboard:view" }]
  },
  {
    label: "学习",
    items: [
      { path: "/profile", label: "学习画像", code: "02", permission: "profile:view" },
      { path: "/courses", label: "课程与任务", code: "03", permission: "course:view" },
      { path: "/records", label: "学习记录", code: "04", permission: "record:view" }
    ]
  },
  {
    label: "考试与审核",
    items: [
      { path: "/questions", label: "题库管理", code: "05", permission: "question:view" },
      { path: "/exams", label: "考试安排", code: "06", permission: "exam:view" },
      { path: "/marking", label: "审核工作台", code: "07", permission: "review:view" }
    ]
  },
  {
    label: "分析与审计",
    items: [
      { path: "/class-results", label: "班级结果", code: "08", permission: "class-results:view" },
      { path: "/reports", label: "评价统计", code: "09", permission: "report:view" },
      { path: "/acceptance", label: "审计记录", code: "10", permission: "audit:view" }
    ]
  }
];

const visibleGroups = computed(() => groups
  .map((group) => ({
    ...group,
    items: group.items.filter((item) => hasPermission(session.profile?.role, item.permission))
  }))
  .filter((group) => group.items.length > 0));

const activeLabel = computed(() => groups
  .flatMap((group) => group.items)
  .find((item) => route.path === item.path || route.path.startsWith(`${item.path}/`))?.label ?? "业务工作台");

const currentRole = computed(() => roleDefinition(session.profile?.role));

function logout() {
  session.logout();
  void router.replace("/login");
}
</script>

<template>
  <router-view v-if="$route.meta.public" />

  <div v-else-if="session.profile" class="product-shell">
    <a class="skip-link" href="#main-content">跳到主要内容</a>
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-mark">政</div>
        <div>
          <strong>思政理论学习考核评价系统</strong>
          <span>学习 · 考试 · 评价</span>
        </div>
      </div>
      <nav aria-label="主导航">
        <div v-for="group in visibleGroups" :key="group.label" class="nav-group">
          <p>{{ group.label }}</p>
          <router-link v-for="item in group.items" :key="item.path" :to="item.path" class="nav-link">
            <span>{{ item.code }}</span>{{ item.label }}
          </router-link>
        </div>
      </nav>
      <div class="side-footer">
        <span class="status-dot"></span>
        <div><strong>服务连接正常</strong><small>API 8211 · Web 5211</small></div>
      </div>
    </aside>

    <main class="main" id="main-content">
      <header class="topbar">
        <span class="folio">思政理论学习考核评价系统 / {{ activeLabel }}</span>
        <div class="top-actions">
          <div class="identity">
            <strong>{{ session.profile.name }}</strong>
            <span>{{ session.profile.orgName }} · {{ currentRole?.label }}</span>
          </div>
          <button class="text-button" type="button" @click="logout">退出登录</button>
        </div>
      </header>
      <div v-if="session.permissionMessage" class="permission-banner" role="alert">
        <span>{{ session.permissionMessage }}</span>
        <button type="button" aria-label="关闭权限提示" @click="session.dismissPermissionMessage()">关闭</button>
      </div>
      <section class="content"><router-view /></section>
    </main>
  </div>

  <main v-else class="auth-check" aria-busy="true" aria-live="polite">
    <strong>正在核验登录状态</strong>
    <span>身份确认完成后才能进入系统。</span>
  </main>
</template>
