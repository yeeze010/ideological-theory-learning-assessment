<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import type { QuestionSummary } from "@assessment/shared";
import { api } from "@/api/client";
import { hasPermission } from "@/auth/roles";
import { useSessionStore } from "@/stores/session";

const session = useSessionStore();
const questions = ref<QuestionSummary[]>([]);
const loading = ref(true);
const saving = ref(false);
const publishingId = ref("");
const showCreate = ref(false);
const error = ref("");
const success = ref("");
const form = reactive({
  bankName: "",
  stem: "",
  optionsText: "",
  answerText: "",
  score: 5
});

const canCreate = computed(() => hasPermission(session.profile?.role, "question:create"));
const canPublish = computed(() => hasPermission(session.profile?.role, "question:publish"));

const typeLabels = { single: "单选题", multiple: "多选题", judge: "判断题" };
const difficultyLabels = { easy: "基础", medium: "中等", hard: "较难" };

async function load() {
  loading.value = true;
  error.value = "";
  try {
    questions.value = await api.questions();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "题库读取失败";
  } finally {
    loading.value = false;
  }
}

async function createQuestion() {
  const options = form.optionsText.split("\n").map((item) => item.trim()).filter(Boolean);
  const answer = form.answerText.split(/[，,\n]/).map((item) => item.trim()).filter(Boolean);
  if (!form.bankName.trim() || !form.stem.trim() || options.length < 2 || !answer.length) {
    error.value = "请填写题库、题干、至少两个选项和正确答案";
    return;
  }
  saving.value = true;
  error.value = "";
  success.value = "";
  try {
    const created = await api.createQuestion({
      bankName: form.bankName.trim(),
      stem: form.stem.trim(),
      options,
      answer,
      score: Number(form.score)
    });
    questions.value.unshift(created);
    success.value = `试题“${created.stem}”已保存并进入审核流程。`;
    showCreate.value = false;
    Object.assign(form, { bankName: "", stem: "", optionsText: "", answerText: "", score: 5 });
  } catch (err) {
    error.value = err instanceof Error ? err.message : "试题保存失败";
  } finally {
    saving.value = false;
  }
}

async function publishQuestion(question: QuestionSummary) {
  publishingId.value = question.id;
  error.value = "";
  success.value = "";
  try {
    const published = await api.publishQuestion(question.id);
    Object.assign(question, published);
    success.value = `题目“${published.stem}”已发布到题库，可用于组卷。`;
  } catch (err) {
    error.value = err instanceof Error ? err.message : "题目发布失败";
  } finally {
    publishingId.value = "";
  }
}

onMounted(load);
</script>

<template>
  <div class="page-head">
    <div>
      <span class="eyebrow">考试管理 / 题库</span>
      <h1>题库管理</h1>
      <p>题库管理员维护试题，其他教学角色按职责查看或审核。</p>
    </div>
    <button v-if="canCreate" class="button primary" type="button" @click="showCreate = true">新增试题</button>
    <button v-else class="button" type="button" :disabled="loading" @click="load">刷新题库</button>
  </div>

  <p v-if="success" class="success-banner" role="status">{{ success }}</p>
  <div v-if="loading" class="state-panel" aria-busy="true">正在读取题库...</div>
  <div v-else-if="error && !questions.length" class="state-panel error-state" role="alert">
    <strong>题库未能载入</strong><span>{{ error }}</span>
    <button class="button" type="button" @click="load">重新读取</button>
  </div>
  <section v-else class="panel data-panel">
    <div class="panel-head"><h2>题目清单</h2><span>{{ questions.length }} 道题目</span></div>
    <div v-if="!questions.length" class="empty-state">
      <strong>当前题库没有题目</strong>
      <span v-if="canCreate">新增题目后将自动进入审核流程。</span>
      <span v-else>请联系题库管理员补充题目。</span>
    </div>
    <table v-else class="data-table">
       <thead><tr><th>所属题库</th><th>题干</th><th>题型</th><th>难度</th><th>分值</th><th>状态</th><th>操作</th></tr></thead>
      <tbody>
        <tr v-for="question in questions" :key="question.id">
          <td>{{ question.bankName }}</td>
          <td><strong>{{ question.stem }}</strong></td>
          <td>{{ typeLabels[question.type] }}</td>
           <td>{{ difficultyLabels[question.difficulty] }}</td>
           <td>{{ question.score }}</td>
           <td><span class="badge" :class="question.status === 'published' ? 'green' : question.status === 'pending_review' ? 'orange' : 'red'">{{ question.status === "published" ? "已发布" : question.status === "pending_review" ? "待发布" : "已归档" }}</span></td>
           <td><button v-if="canPublish && question.status === 'pending_review'" class="text-button" type="button" :disabled="publishingId === question.id" @click="publishQuestion(question)">{{ publishingId === question.id ? "正在发布..." : "发布题目" }}</button><span v-else class="muted-text">{{ question.status === "published" ? "可组卷" : "不可操作" }}</span></td>
        </tr>
      </tbody>
    </table>
  </section>

  <el-dialog v-model="showCreate" title="新增试题" width="min(680px, 92vw)">
    <form @submit.prevent="createQuestion">
      <div class="form-grid">
        <div class="field full">
          <label for="question-bank">所属题库</label>
          <input id="question-bank" v-model="form.bankName" autocomplete="off" />
        </div>
        <div class="field full">
          <label for="question-stem">题干</label>
          <textarea id="question-stem" v-model="form.stem" rows="4"></textarea>
        </div>
        <div class="field full">
          <label for="question-options">选项</label>
          <textarea id="question-options" v-model="form.optionsText" rows="4" placeholder="每行填写一个选项"></textarea>
        </div>
        <div class="field">
          <label for="question-answer">正确答案</label>
          <input id="question-answer" v-model="form.answerText" placeholder="多项答案使用逗号分隔" />
        </div>
        <div class="field">
          <label for="question-score">分值</label>
          <input id="question-score" v-model.number="form.score" type="number" min="1" />
        </div>
      </div>
      <p v-if="error" class="form-alert" role="alert">{{ error }}</p>
      <div class="dialog-actions">
        <button class="button" type="button" @click="showCreate = false">取消</button>
        <button class="button primary" type="submit" :disabled="saving">{{ saving ? "正在保存..." : "保存并送审" }}</button>
      </div>
    </form>
  </el-dialog>
</template>
