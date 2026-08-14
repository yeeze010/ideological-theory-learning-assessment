<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import type { ExamPlanSummary } from "@assessment/shared";
import { api } from "@/api/client";
import { hasPermission } from "@/auth/roles";
import { useSessionStore } from "@/stores/session";

const session = useSessionStore();
const exams = ref<ExamPlanSummary[]>([]);
const loading = ref(true);
const error = ref("");
const canAttempt = computed(() => hasPermission(session.profile?.role, "exam:attempt"));

const statusLabels = {
  draft: "草稿",
  published: "待开始",
  running: "进行中",
  closed: "已结束"
};

async function load() {
  loading.value = true;
  error.value = "";
  try {
    exams.value = await api.exams();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "考试计划读取失败";
  } finally {
    loading.value = false;
  }
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date(value));
}

onMounted(load);
</script>

<template>
  <div class="page-head">
    <div>
      <span class="eyebrow">考试管理 / 考试计划</span>
      <h1>在线考试</h1>
      <p>{{ canAttempt ? "查看本人可参加的考试，并在开放时间内进入答题。" : "查看当前数据范围内的考试安排和执行状态。" }}</p>
    </div>
    <button class="button" type="button" :disabled="loading" @click="load">{{ loading ? "正在刷新..." : "刷新考试计划" }}</button>
  </div>

  <div v-if="loading" class="state-panel" aria-busy="true">正在读取考试计划...</div>
  <div v-else-if="error" class="state-panel error-state" role="alert">
    <strong>考试计划未能载入</strong><span>{{ error }}</span>
    <button class="button" type="button" @click="load">重新读取</button>
  </div>
  <section v-else class="panel data-panel">
    <div class="panel-head"><h2>考试计划</h2><span>{{ exams.length }} 场考试</span></div>
    <div v-if="!exams.length" class="empty-state">
      <strong>当前没有可查看的考试</strong>
      <span>新考试发布后会显示在这里。</span>
    </div>
    <table v-else class="data-table">
      <thead><tr><th>考试名称</th><th>所属课程</th><th>考试时间</th><th>时长</th><th>及格分</th><th>状态</th><th>操作</th></tr></thead>
      <tbody>
        <tr v-for="exam in exams" :key="exam.id">
          <td><strong>{{ exam.title }}</strong></td>
          <td>{{ exam.courseTitle }}</td>
          <td>{{ formatTime(exam.startAt) }} 至 {{ formatTime(exam.endAt) }}</td>
          <td>{{ exam.durationMinutes }} 分钟</td>
          <td>{{ exam.passScore }}</td>
          <td><span class="badge" :class="exam.status === 'running' ? 'red' : exam.status === 'published' ? 'green' : 'orange'">{{ statusLabels[exam.status] }}</span></td>
          <td>
            <router-link v-if="canAttempt && ['running', 'published'].includes(exam.status)" :to="`/exams/${exam.id}/attempt`">进入考试</router-link>
            <span v-else class="muted-text">仅查看</span>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>
