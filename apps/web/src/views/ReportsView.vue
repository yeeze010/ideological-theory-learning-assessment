<script setup lang="ts">
import { onMounted, ref } from "vue";
import type { DashboardOverview } from "@assessment/shared";
import { api } from "@/api/client";

const overview = ref<DashboardOverview>();

onMounted(async () => {
  overview.value = await api.overview();
});
</script>

<template>
  <section class="page-title">
    <div>
      <h1>统计报表</h1>
      <p>学习完成率、考试通过率、组织排名、题目分析和验收导出。</p>
    </div>
    <el-button>导出验收报表</el-button>
  </section>
  <section class="metric-grid">
    <div class="metric">
      <label>课程完成率</label>
      <strong>{{ overview?.completionRate ?? "-" }}%</strong>
    </div>
    <div class="metric">
      <label>考试通过率</label>
      <strong>{{ overview?.passRate ?? "-" }}%</strong>
    </div>
    <div class="metric">
      <label>待阅卷</label>
      <strong>{{ overview?.pendingReviews ?? "-" }}</strong>
    </div>
    <div class="metric">
      <label>风险预警</label>
      <strong>{{ overview?.riskAlerts ?? "-" }}</strong>
    </div>
  </section>
  <section class="panel">
    <div class="panel-header">
      <h2>组织考核排行</h2>
    </div>
    <el-table
      :data="[
        { org: '2026级一班', completion: 86, pass: 91 },
        { org: '2026级二班', completion: 78, pass: 84 },
        { org: '马克思主义学院教师组', completion: 73, pass: 82 }
      ]"
      stripe
    >
      <el-table-column prop="org" label="组织" />
      <el-table-column prop="completion" label="学习完成率" />
      <el-table-column prop="pass" label="考试通过率" />
    </el-table>
  </section>
</template>
