<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import type { DashboardOverview } from "@assessment/shared";
import { api } from "@/api/client";
import { hasPermission } from "@/auth/roles";
import { useSessionStore } from "@/stores/session";

const session = useSessionStore();
const overview = ref<DashboardOverview | null>(null);
const loading = ref(true);
const error = ref("");

const canCreateCourse = computed(() => hasPermission(session.profile?.role, "course:create"));

async function load() {
  loading.value = true;
  error.value = "";
  try {
    overview.value = await api.overview();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "总览数据读取失败";
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="page-head">
    <div>
      <span class="eyebrow">总览 / 当前学期</span>
      <h1>考核工作总览</h1>
      <p>汇总当前账号数据范围内的课程、考试、审核任务和学习风险。</p>
    </div>
    <router-link v-if="canCreateCourse" class="button primary button-link" to="/courses?create=1">创建课程</router-link>
    <button v-else class="button" type="button" :disabled="loading" @click="load">{{ loading ? "正在刷新..." : "刷新数据" }}</button>
  </div>

  <div v-if="loading" class="state-panel" aria-busy="true">正在读取当前角色的学评数据...</div>
  <div v-else-if="error" class="state-panel error-state" role="alert">
    <strong>总览数据未能载入</strong>
    <span>{{ error }}</span>
    <button class="button" type="button" @click="load">重新读取</button>
  </div>
  <template v-else-if="overview">
    <div class="flow-track">
      <div v-for="(item, index) in [
        { label: '课程建设', value: overview.courseCount, unit: '门课程' },
        { label: '学习参与', value: overview.learnerCount, unit: '名学习者' },
        { label: '考试组织', value: overview.examCount, unit: '场考试' },
        { label: '完成情况', value: overview.completionRate, unit: '% 完成' },
        { label: '审核处理', value: overview.pendingReviews, unit: '项待处理' },
        { label: '风险跟进', value: overview.riskAlerts, unit: '项预警' }
      ]" :key="item.label" class="flow-step">
        <b>0{{ index + 1 }}</b>
        <strong>{{ item.label }}</strong>
        <span>{{ item.value }} {{ item.unit }}</span>
      </div>
    </div>

    <div class="metric-grid dashboard-metrics">
      <div class="metric"><label>课程数量</label><strong>{{ overview.courseCount }}</strong><small>当前数据范围</small></div>
      <div class="metric"><label>考试数量</label><strong>{{ overview.examCount }}</strong><small>已纳入考核计划</small></div>
      <div class="metric"><label>考试通过率</label><strong>{{ overview.passRate }}%</strong><small>按已提交成绩统计</small></div>
      <div class="metric"><label>待处理事项</label><strong>{{ overview.pendingReviews + overview.riskAlerts }}</strong><small>审核与学习风险合计</small></div>
    </div>
  </template>
</template>
