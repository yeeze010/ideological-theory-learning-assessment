<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { RoleCode } from "@assessment/shared";
import { createEmptyLoginForm, validateLoginForm } from "@/auth/login-form";
import { homePathForRole, LOGIN_ROLE_OPTIONS, roleDefinition } from "@/auth/roles";
import { useSessionStore } from "@/stores/session";

const form = reactive(createEmptyLoginForm());
const errors = reactive<{ role?: string; username?: string; password?: string }>({});
const selectedRole = computed(() => roleDefinition(form.role || undefined));
const error = ref("");
const loading = ref(false);
const route = useRoute();
const router = useRouter();
const session = useSessionStore();

async function login() {
  error.value = "";
  Object.assign(errors, { role: undefined, username: undefined, password: undefined }, validateLoginForm(form));
  if (errors.role || errors.username || errors.password || !form.role) return;

  loading.value = true;
  try {
    await session.login(form.role as RoleCode, form.username.trim(), form.password);
    const redirect = typeof route.query.redirect === "string"
      ? route.query.redirect
      : homePathForRole(session.profile?.role);
    void router.replace(redirect);
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
      <p>系统按任职角色核验身份并分配工作范围。学习者完成课程与考试，教学人员维护课程和题库，管理与督导人员处理审核、质量分析和审计工作。</p>
      <div class="flow-track login-flow">
        <div v-for="(item, index) in ['身份核验', '范围授权', '业务办理', '操作留痕']" :key="item" class="flow-step">
          <b>0{{ index + 1 }}</b>
          <strong>{{ item }}</strong>
          <span>按实际角色进入</span>
        </div>
      </div>
    </section>

    <form class="login-form" novalidate @submit.prevent="login">
      <span class="eyebrow">登录系统</span>
      <h2>进入思政理论学习考核评价系统</h2>

      <div class="field">
        <label for="login-role">角色</label>
        <select id="login-role" v-model="form.role" :aria-invalid="Boolean(errors.role)" aria-describedby="login-role-error">
          <option value="" disabled>请选择角色</option>
          <option v-for="role in LOGIN_ROLE_OPTIONS" :key="role.code" :value="role.code">{{ role.label }}</option>
        </select>
        <small v-if="errors.role" id="login-role-error" class="field-error">{{ errors.role }}</small>
      </div>

      <div class="field login-field">
        <label for="login-username">用户名</label>
        <input id="login-username" v-model="form.username" autocomplete="username" :aria-invalid="Boolean(errors.username)" aria-describedby="login-username-error" />
        <small v-if="errors.username" id="login-username-error" class="field-error">{{ errors.username }}</small>
      </div>

      <div class="field login-field">
        <label for="login-password">密码</label>
        <input id="login-password" v-model="form.password" type="password" autocomplete="current-password" :aria-invalid="Boolean(errors.password)" aria-describedby="login-password-error" />
        <small v-if="errors.password" id="login-password-error" class="field-error">{{ errors.password }}</small>
      </div>

      <button class="button primary login-submit" :disabled="loading" type="submit">
        {{ loading ? "正在校验身份..." : "登录" }}
      </button>
      <p v-if="route.query.reason === 'expired'" class="form-alert" role="alert">登录状态已失效，请重新登录。</p>
      <p v-if="error" class="form-alert" role="alert">{{ error }}</p>
      <p class="role-scope">{{ selectedRole ? `当前角色范围：${selectedRole.scope}` : "请选择实际任职角色，角色必须与账号权限一致。" }}</p>
    </form>
  </main>
</template>
