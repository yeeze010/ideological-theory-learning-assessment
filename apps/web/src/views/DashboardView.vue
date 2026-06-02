<script setup lang="ts">
import type { DashboardOverview } from "@assessment/shared";
import { onMounted, ref } from "vue";
import { api } from "@/api/client";

const overview = ref<DashboardOverview>();

onMounted(async () => {
  overview.value = await api.overview();
});
</script>

<template>
  <section class="page-title">
    <div>
      <h1>工作台</h1>
      <p>学习、考试、证书和风险预警的统一入口。</p>
    </div>
    <el-tag type="danger">今日待处理 {{ overview?.riskAlerts ?? 0 }} 项</el-tag>
  </section>

  <section class="metric-grid">
    <div class="metric">
      <label>学员数</label>
      <strong>{{ overview?.learnerCount ?? "-" }}</strong>
    </div>
    <div class="metric">
      <label>课程数</label>
      <strong>{{ overview?.courseCount ?? "-" }}</strong>
    </div>
    <div class="metric">
      <label>学习完成率</label>
      <strong>{{ overview?.completionRate ?? "-" }}%</strong>
    </div>
    <div class="metric">
      <label>考试通过率</label>
      <strong>{{ overview?.passRate ?? "-" }}%</strong>
    </div>
  </section>

  <section class="panel">
    <div class="panel-header">
      <h2>验收闭环</h2>
      <span>课程发布 -> 学习进度 -> 在线考试 -> 成绩发布 -> 证书归档</span>
    </div>
    <el-steps :active="3" finish-status="success" simple>
      <el-step title="课程发布" />
      <el-step title="学习中" />
      <el-step title="考试中" />
      <el-step title="成绩归档" />
    </el-steps>
  </section>
</template>
