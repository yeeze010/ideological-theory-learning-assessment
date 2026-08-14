<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import type { LearningProfile, LearningRecommendation, ReviewTask } from "@assessment/shared";
import { api } from "@/api/client";

const props = defineProps<{ mode: "records" | "marking" }>();
const profile = ref<LearningProfile | null>(null);
const recommendations = ref<LearningRecommendation[]>([]);
const reviews = ref<ReviewTask[]>([]);
const loading = ref(true);
const activeId = ref("");
const error = ref("");
const success = ref("");

const title = computed(() => props.mode === "records" ? "学习记录" : "审核工作台");

async function load() {
  loading.value = true;
  error.value = "";
  success.value = "";
  try {
    if (props.mode === "records") {
      [profile.value, recommendations.value] = await Promise.all([
        api.learningProfile(),
        api.learningRecommendations()
      ]);
    } else {
      reviews.value = await api.pendingReviews();
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : "业务数据读取失败";
  } finally {
    loading.value = false;
  }
}

async function approve(task: ReviewTask) {
  activeId.value = task.id;
  error.value = "";
  success.value = "";
  try {
    const updated = await api.approveReview(task.id);
    reviews.value = reviews.value.filter((item) => item.id !== updated.id);
    success.value = `“${updated.title}”已审核通过。`;
  } catch (err) {
    error.value = err instanceof Error ? err.message : "审核操作失败";
  } finally {
    activeId.value = "";
  }
}

onMounted(load);
watch(() => props.mode, load);
</script>

<template>
  <div class="page-head">
    <div>
      <span class="eyebrow">{{ mode === "records" ? "学习管理 / 过程记录" : "考试管理 / 审核任务" }}</span>
      <h1>{{ title }}</h1>
      <p>{{ mode === "records" ? "根据服务端记录查看有效学习时长、任务完成情况和薄弱知识点。" : "处理当前角色职责范围内的题目、建议和预警审核任务。" }}</p>
    </div>
    <button class="button" type="button" :disabled="loading" @click="load">{{ loading ? "正在刷新..." : "刷新数据" }}</button>
  </div>

  <p v-if="success" class="success-banner" role="status">{{ success }}</p>
  <div v-if="loading" class="state-panel" aria-busy="true">正在读取{{ title }}...</div>
  <div v-else-if="error && (mode === 'records' ? !profile : !reviews.length)" class="state-panel error-state" role="alert">
    <strong>{{ title }}未能载入</strong><span>{{ error }}</span>
    <button class="button" type="button" @click="load">重新读取</button>
  </div>

  <template v-else-if="mode === 'records' && profile">
    <div class="metric-grid">
      <div class="metric"><label>学习者</label><strong class="metric-name">{{ profile.learnerName }}</strong><small>当前数据范围</small></div>
      <div class="metric"><label>有效学习时长</label><strong>{{ profile.studyMinutes }}</strong><small>分钟</small></div>
      <div class="metric"><label>已完成任务</label><strong>{{ profile.completedTasks }}</strong><small>{{ profile.pendingTasks }} 项待完成</small></div>
      <div class="metric"><label>综合掌握度</label><strong>{{ profile.overallMastery }}%</strong><small>风险等级：{{ profile.riskLevel }}</small></div>
    </div>
    <div class="grid-2">
      <section class="panel">
        <div class="panel-head"><h2>知识点记录</h2><span>{{ profile.diagnostics.length }} 个知识点</span></div>
        <div v-if="!profile.diagnostics.length" class="empty-state"><strong>还没有诊断记录</strong><span>完成考试后会形成知识点记录。</span></div>
        <table v-else class="data-table">
          <thead><tr><th>知识点</th><th>掌握度</th><th>错题数</th><th>趋势</th><th>状态</th></tr></thead>
          <tbody>
            <tr v-for="item in profile.diagnostics" :key="item.knowledgePoint">
              <td><strong>{{ item.knowledgePoint }}</strong></td>
              <td>{{ item.mastery }}%</td>
              <td>{{ item.errorCount }}</td>
              <td>{{ item.trend }}</td>
              <td><span class="badge" :class="item.status === 'weak' ? 'red' : item.status === 'developing' ? 'orange' : 'green'">{{ item.status }}</span></td>
            </tr>
          </tbody>
        </table>
      </section>
      <section class="panel">
        <div class="panel-head"><h2>学习建议</h2><span>{{ recommendations.length }} 条</span></div>
        <div v-if="!recommendations.length" class="empty-state"><strong>当前没有补学建议</strong><span>系统会根据新的学习和答题记录更新建议。</span></div>
        <div v-else class="panel-body timeline">
          <div v-for="item in recommendations" :key="item.id" class="timeline-row">
            <time>{{ item.priority }}</time><i class="timeline-dot"></i>
            <div><strong>{{ item.title }}</strong><span>{{ item.reason }}</span></div>
          </div>
        </div>
      </section>
    </div>
  </template>

  <section v-else-if="mode === 'marking'" class="panel data-panel">
    <div class="panel-head"><h2>待审核任务</h2><span>{{ reviews.length }} 项</span></div>
    <div v-if="!reviews.length" class="empty-state">
      <strong>当前没有待审核任务</strong>
      <span>新的题目、建议或预警提交后会进入这里。</span>
    </div>
    <table v-else class="data-table">
      <thead><tr><th>任务名称</th><th>类型</th><th>提交人</th><th>目标角色</th><th>提交时间</th><th>操作</th></tr></thead>
      <tbody>
        <tr v-for="task in reviews" :key="task.id">
          <td><strong>{{ task.title }}</strong></td>
          <td>{{ task.type }}</td>
          <td>{{ task.submittedBy }}</td>
          <td>{{ task.targetRole }}</td>
          <td>{{ new Date(task.createdAt).toLocaleString("zh-CN") }}</td>
          <td><button class="text-button" type="button" :disabled="activeId === task.id" @click="approve(task)">{{ activeId === task.id ? "正在处理..." : "审核通过" }}</button></td>
        </tr>
      </tbody>
    </table>
  </section>
  <p v-if="error && (profile || reviews.length)" class="form-alert" role="alert">{{ error }}</p>
</template>
