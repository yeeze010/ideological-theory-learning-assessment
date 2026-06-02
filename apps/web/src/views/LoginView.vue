<script setup lang="ts">
import { reactive } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { useSessionStore } from "@/stores/session";

const router = useRouter();
const session = useSessionStore();
const form = reactive({
  username: "admin",
  password: "Admin@123"
});

async function submit() {
  try {
    await session.login(form.username, form.password);
    await router.push("/dashboard");
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "登录失败");
  }
}
</script>

<template>
  <main class="login-page">
    <section class="login-hero">
      <h1>思政理论学习考核评价系统</h1>
      <p>
        覆盖课程学习、在线考试、题库管理、自动阅卷、学习积分、证书生成和考核结果分析。
        当前版本提供可演示的管理后台与学习端主流程。
      </p>
    </section>
    <section class="login-form">
      <h2>账号登录</h2>
      <p>管理员：admin / Admin@123；学员：student / Student@123</p>
      <el-form label-position="top" @submit.prevent="submit">
        <el-form-item label="账号">
          <el-input v-model="form.username" autocomplete="username" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="form.password" type="password" autocomplete="current-password" show-password />
        </el-form-item>
        <el-button type="primary" :loading="session.loading" @click="submit">登录</el-button>
      </el-form>
    </section>
  </main>
</template>
