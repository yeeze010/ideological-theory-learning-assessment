<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import type { LearningAlert, LearningProfile, LearningRecommendation, ReviewTask } from "@assessment/shared";
import { api } from "@/api/client";
import { useSessionStore } from "@/stores/session";

const session = useSessionStore();
const profile = ref<LearningProfile | null>(null);
const recommendations = ref<LearningRecommendation[]>([]);
const alerts = ref<LearningAlert[]>([]);
const reviews = ref<ReviewTask[]>([]);
const loading = ref(true);
const message = ref("");
const error = ref("");

const isLearner = computed(() => session.profile?.role === "learner");

async function load() {
  loading.value = true;
  message.value = "";
  error.value = "";
  try {
    profile.value = await api.learningProfile();
    recommendations.value = await api.learningRecommendations();
    if (!isLearner.value) {
      alerts.value = await api.learningAlerts();
      reviews.value = await api.pendingReviews();
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : "学习画像读取失败";
  } finally {
    loading.value = false;
  }
}

async function approve(id: string) {
  error.value = "";
  try {
    const result = await api.approveReview(id);
    await load();
    message.value = `${result.title} 已审核通过`;
  } catch (err) {
    error.value = err instanceof Error ? err.message : "审核操作失败";
  }
}

onMounted(load);
</script>

<template>
  <div class="page-head">
    <div>
      <span class="eyebrow">学习端 / 画像诊断</span>
      <h1>学习画像与薄弱诊断</h1>
      <p>把学习记录、考试作答和知识点掌握度汇总成可处理的推荐、预警与审核任务。</p>
    </div>
    <button class="button" :disabled="loading" @click="load">刷新画像</button>
  </div>

  <div v-if="loading" class="state-panel" aria-busy="true">正在汇总学习画像...</div>
  <div v-else-if="error && !profile" class="state-panel error-state" role="alert">
    <strong>学习画像未能载入</strong><span>{{ error }}</span>
    <button class="button" type="button" @click="load">重新读取</button>
  </div>
  <p v-else-if="error" class="form-alert" role="alert">{{ error }}</p>

  <template v-if="profile">
    <div class="metric-grid">
      <div class="metric"><label>综合掌握度</label><strong>{{ profile.overallMastery }}%</strong><small>基于知识点答题证据</small></div>
      <div class="metric"><label>有效学习时长</label><strong>{{ profile.studyMinutes }}</strong><small>分钟</small></div>
      <div class="metric"><label>已完成任务</label><strong>{{ profile.completedTasks }}</strong><small>{{ profile.pendingTasks }} 项待完成</small></div>
      <div class="metric"><label>学习风险</label><strong>{{ profile.riskLevel }}</strong><small class="danger">薄弱点优先干预</small></div>
    </div>

    <div class="grid-2">
      <section class="panel">
        <div class="panel-head"><h2>知识点诊断</h2><span>按掌握度从低到高</span></div>
        <table class="data-table">
          <thead><tr><th>知识点</th><th>掌握度</th><th>错题</th><th>趋势</th><th>状态</th></tr></thead>
          <tbody>
            <tr v-for="item in profile.diagnostics" :key="item.knowledgePoint">
              <td><strong>{{ item.knowledgePoint }}</strong></td>
              <td><div class="progress"><i :style="{ width: item.mastery + '%' }"></i></div></td>
              <td>{{ item.errorCount }}</td>
              <td>{{ item.trend }}</td>
              <td><span class="badge" :class="item.status === 'weak' ? 'red' : item.status === 'developing' ? 'orange' : 'green'">{{ item.status }}</span></td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="panel">
        <div class="panel-head"><h2>错题与材料推荐</h2><span>{{ recommendations.length }} 条</span></div>
        <div class="panel-body timeline">
          <div v-for="item in recommendations" :key="item.id" class="timeline-row">
            <time>{{ item.priority }}</time>
            <i class="timeline-dot"></i>
            <div><strong>{{ item.title }}</strong><span>{{ item.reason }} · {{ item.type }}</span></div>
          </div>
          <p v-if="!recommendations.length" style="color:var(--muted);font-size:12px">暂无待推荐材料。</p>
        </div>
      </section>
    </div>

    <div v-if="!isLearner" class="grid-2">
      <section class="panel">
        <div class="panel-head"><h2>学习预警</h2><span>教师确认后进入干预</span></div>
        <table class="data-table">
          <thead><tr><th>学生</th><th>预警</th><th>原因</th><th>状态</th></tr></thead>
          <tbody>
            <tr v-for="alert in alerts" :key="alert.id">
              <td><strong>{{ alert.learnerName }}</strong></td>
              <td>{{ alert.title }}</td>
              <td>{{ alert.reason }}</td>
              <td><span class="badge red">{{ alert.status }}</span></td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="panel">
        <div class="panel-head"><h2>审核闭环</h2><span v-if="message" class="badge green">{{ message }}</span><span v-else>{{ reviews.length }} 项待处理</span></div>
        <table class="data-table">
          <thead><tr><th>任务</th><th>提交方</th><th>角色</th><th>操作</th></tr></thead>
          <tbody>
            <tr v-for="task in reviews" :key="task.id">
              <td><strong>{{ task.title }}</strong></td>
              <td>{{ task.submittedBy }}</td>
              <td>{{ task.targetRole }}</td>
              <td><button class="text-button" @click="approve(task.id)">通过</button></td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  </template>
</template>
