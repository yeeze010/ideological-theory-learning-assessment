<script setup lang="ts">
import { useRouter } from "vue-router";
import { useSessionStore } from "@/stores/session";

const router = useRouter();
const session = useSessionStore();

function logout() {
  session.logout();
  void router.push("/login");
}
</script>

<template>
  <router-view v-if="$route.path === '/login'" />
  <el-container v-else class="shell">
    <el-aside class="sidebar" width="248px">
      <div class="brand">
        <div class="brand-mark">IT</div>
        <div>
          <strong>思政考核平台</strong>
          <span>Learning Assessment</span>
        </div>
      </div>
      <el-menu :default-active="$route.path" router class="nav-menu">
        <el-menu-item index="/dashboard">工作台</el-menu-item>
        <el-menu-item index="/courses">课程学习</el-menu-item>
        <el-menu-item index="/questions">题库管理</el-menu-item>
        <el-menu-item index="/exams">在线考试</el-menu-item>
        <el-menu-item index="/reports">统计报表</el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="topbar">
        <div>
          <strong>{{ session.profile?.orgName }}</strong>
          <span>当前登录：{{ session.profile?.name }} / {{ session.profile?.role }}</span>
        </div>
        <el-button plain @click="logout">退出登录</el-button>
      </el-header>
      <el-main class="content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>
