<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import type { RoleCode } from "@assessment/shared";
import { useSessionStore } from "@/stores/session";

const accounts: Array<{ role: RoleCode; label: string; username: string; password: string; scope: string }> = [
  { role: "platform_admin", label: "平台管理员", username: "admin", password: "Admin@123", scope: "全校配置、审计和审核闭环" },
  { role: "course_admin", label: "任课教师", username: "teacher", password: "Teacher@123", scope: "课程、学习预警和干预审核" },
  { role: "question_admin", label: "题库管理员", username: "question", password: "Question@123", scope: "题库维护和试题审核" },
  { role: "supervisor", label: "学习督导员", username: "supervisor", password: "Supervisor@123", scope: "班级学习预警和处理跟踪" },
  { role: "learner", label: "学生", username: "student", password: "Student@123", scope: "本人学习、考试和画像反馈" }
];

const selectedRole = ref<RoleCode>("learner");
const selectedAccount = computed(() => accounts.find((item) => item.role === selectedRole.value)!);
const username = ref(selectedAccount.value.username);
const password = ref(selectedAccount.value.password);
const error = ref("");
const loading = ref(false);
const router = useRouter();
const session = useSessionStore();

watch(selectedRole, () => {
  username.value = selectedAccount.value.username;
  password.value = selectedAccount.value.password;
  error.value = "";
});

async function login() {
  loading.value = true;
  error.value = "";
  try {
    await session.login(selectedRole.value, username.value, password.value);
    void router.push("/dashboard");
  } catch (err) {
    error.value = err instanceof Error ? err.message : "登录失败";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <main class="login-page">
    <section class="login-hero">
      <span class="eyebrow">思想理论学习 · 考核评价 · 成长反馈</span>
      <h1>让每一次理论学习，都形成可见的进步。</h1>
      <p>登录会同时校验角色、账号和密码。学生只能访问本人学习与考试，教师和管理角色进入题库、预警、审核和统计闭环。</p>
      <div class="flow-track" style="margin-top:48px">
        <div v-for="(x, i) in ['角色隔离', '画像诊断', '材料推荐', '审核闭环']" :key="x" class="flow-step">
          <b>0{{ i + 1 }}</b>
          <strong>{{ x }}</strong>
          <span>全过程留痕</span>
        </div>
      </div>
    </section>
    <section class="login-form">
      <span class="eyebrow">登录系统</span>
      <h2>进入思政学评</h2>
      <div class="field">
        <label>角色</label>
        <select v-model="selectedRole">
          <option v-for="account in accounts" :key="account.role" :value="account.role">{{ account.label }}</option>
        </select>
      </div>
      <div class="field" style="margin-top:14px">
        <label>账号</label>
        <input v-model="username" autocomplete="username" />
      </div>
      <div class="field" style="margin-top:14px">
        <label>密码</label>
        <input v-model="password" type="password" autocomplete="current-password" @keyup.enter="login" />
      </div>
      <button class="button primary" style="margin-top:18px" :disabled="loading" @click="login">
        {{ loading ? "登录中..." : "登录" }}
      </button>
      <p v-if="error" class="danger" style="font-size:12px">{{ error }}</p>
      <p style="color:var(--muted);font-size:11px">当前角色范围：{{ selectedAccount.scope }}</p>
    </section>
  </main>
</template>
