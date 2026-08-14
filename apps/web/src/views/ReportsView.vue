<script setup lang="ts">
import { onMounted, ref } from "vue";
import type { AuditLogItem, DashboardOverview } from "@assessment/shared";
import { api } from "@/api/client";

const overview = ref<DashboardOverview | null>(null);
const logs = ref<AuditLogItem[]>([]);
const loading = ref(true);
const error = ref("");

async function load() {
  loading.value = true;
  error.value = "";
  try {
    [overview.value, logs.value] = await Promise.all([api.overview(), api.auditLogs()]);
  } catch (err) {
    error.value = err instanceof Error ? err.message : "统计数据读取失败";
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="page-head">
    <div>
      <span class="eyebrow">管理分析 / 评价统计</span>
      <h1>评价与统计</h1>
      <p>展示当前账号数据范围内的学习完成、考试通过、审核和风险指标。</p>
    </div>
    <button class="button" type="button" :disabled="loading" @click="load">{{ loading ? "正在刷新..." : "刷新统计" }}</button>
  </div>

  <div v-if="loading" class="state-panel" aria-busy="true">正在汇总评价数据...</div>
  <div v-else-if="error" class="state-panel error-state" role="alert">
    <strong>统计数据未能载入</strong><span>{{ error }}</span>
    <button class="button" type="button" @click="load">重新读取</button>
  </div>
  <template v-else-if="overview">
    <div class="metric-grid">
      <div class="metric"><label>课程数量</label><strong>{{ overview.courseCount }}</strong><small>当前可访问课程</small></div>
      <div class="metric"><label>考试通过率</label><strong>{{ overview.passRate }}%</strong><small>已提交成绩口径</small></div>
      <div class="metric"><label>学习完成率</label><strong>{{ overview.completionRate }}%</strong><small>当前数据范围</small></div>
      <div class="metric"><label>待处理事项</label><strong>{{ overview.pendingReviews + overview.riskAlerts }}</strong><small>审核与预警合计</small></div>
    </div>
    <section class="panel data-panel">
      <div class="panel-head"><h2>近期评价操作</h2><span>{{ logs.length }} 条审计记录</span></div>
      <div v-if="!logs.length" class="empty-state"><strong>还没有操作记录</strong><span>登录、课程、考试和审核操作会记录在这里。</span></div>
      <table v-else class="data-table">
        <thead><tr><th>时间</th><th>操作人</th><th>操作</th><th>业务对象</th><th>来源地址</th></tr></thead>
        <tbody>
          <tr v-for="log in logs" :key="log.id">
            <td>{{ new Date(log.createdAt).toLocaleString("zh-CN") }}</td>
            <td><strong>{{ log.actorName }}</strong></td>
            <td>{{ log.action }}</td>
            <td>{{ log.resourceType }} / {{ log.resourceName }}</td>
            <td>{{ log.ip }}</td>
          </tr>
        </tbody>
      </table>
    </section>
  </template>
</template>
