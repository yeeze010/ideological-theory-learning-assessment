<script setup lang="ts">
import { onMounted, ref } from "vue";
import type { AuditLogItem } from "@assessment/shared";
import { api } from "@/api/client";

const logs = ref<AuditLogItem[]>([]);
const loading = ref(true);
const error = ref("");

async function load() {
  loading.value = true;
  error.value = "";
  try {
    logs.value = await api.auditLogs();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "审计记录读取失败";
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="page-head">
    <div>
      <span class="eyebrow">系统治理 / 审计记录</span>
      <h1>操作审计</h1>
      <p>按服务端审计日志核对登录、课程、考试和审核操作，不在前端生成或改写验收结果。</p>
    </div>
    <button class="button" type="button" :disabled="loading" @click="load">{{ loading ? "正在刷新..." : "刷新审计记录" }}</button>
  </div>

  <div v-if="loading" class="state-panel" aria-busy="true">正在读取审计记录...</div>
  <div v-else-if="error" class="state-panel error-state" role="alert">
    <strong>审计记录未能载入</strong><span>{{ error }}</span>
    <button class="button" type="button" @click="load">重新读取</button>
  </div>
  <section v-else class="panel data-panel">
    <div class="panel-head"><h2>近期操作</h2><span>{{ logs.length }} 条</span></div>
    <div v-if="!logs.length" class="empty-state"><strong>当前没有审计记录</strong><span>产生业务操作后，服务端记录会显示在这里。</span></div>
    <table v-else class="data-table">
      <thead><tr><th>时间</th><th>操作人</th><th>操作</th><th>资源类型</th><th>资源名称</th><th>来源地址</th></tr></thead>
      <tbody>
        <tr v-for="log in logs" :key="log.id">
          <td>{{ new Date(log.createdAt).toLocaleString("zh-CN") }}</td>
          <td><strong>{{ log.actorName }}</strong></td>
          <td>{{ log.action }}</td>
          <td>{{ log.resourceType }}</td>
          <td>{{ log.resourceName }}</td>
          <td>{{ log.ip }}</td>
        </tr>
      </tbody>
    </table>
  </section>
</template>
