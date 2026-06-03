<script setup lang="ts">
import type { AuditLogItem, DashboardOverview } from "@assessment/shared";
import { onMounted, ref } from "vue";
import { api } from "@/api/client";

const overview = ref<DashboardOverview>();
const auditLogs = ref<AuditLogItem[]>([]);

onMounted(async () => {
  const [overviewData, logs] = await Promise.all([api.overview(), api.auditLogs()]);
  overview.value = overviewData;
  auditLogs.value = logs;
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

  <section class="panel">
    <div class="panel-header">
      <h2>最近审计日志</h2>
      <span>记录关键业务动作，支撑验收追溯</span>
    </div>
    <el-table :data="auditLogs" stripe>
      <el-table-column prop="createdAt" label="时间" width="210">
        <template #default="{ row }">
          {{ new Date(row.createdAt).toLocaleString() }}
        </template>
      </el-table-column>
      <el-table-column prop="actorName" label="操作人" width="130" />
      <el-table-column prop="action" label="动作" width="130" />
      <el-table-column prop="resourceType" label="资源类型" width="130" />
      <el-table-column prop="resourceName" label="资源名称" min-width="260" />
      <el-table-column prop="ip" label="IP" width="120" />
    </el-table>
  </section>
</template>
