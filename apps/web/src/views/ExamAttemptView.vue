<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { ExamEntry, ExamResult } from "@assessment/shared";
import { api } from "@/api/client";

const route = useRoute();
const router = useRouter();
const entry = ref<ExamEntry | null>(null);
const result = ref<ExamResult | null>(null);
const answers = reactive<Record<string, string[]>>({});
const loading = ref(true);
const submitting = ref(false);
const error = ref("");

const answeredCount = computed(() => Object.values(answers).filter((items) => items.length > 0).length);
const resultMap = computed(() => new Map((result.value?.details ?? []).map((detail) => [detail.questionId, detail])));

async function load() {
  loading.value = true;
  error.value = "";
  try {
    entry.value = await api.examEntry(String(route.params.id));
    for (const question of entry.value.questions) answers[question.id] = [];
  } catch (err) {
    error.value = err instanceof Error ? err.message : "试卷读取失败";
  } finally {
    loading.value = false;
  }
}

function selectSingle(questionId: string, option: string) {
  answers[questionId] = [option];
}

function toggleMultiple(questionId: string, option: string, event: Event) {
  const checked = (event.target as HTMLInputElement).checked;
  const current = answers[questionId] ?? [];
  answers[questionId] = checked
    ? [...new Set([...current, option])]
    : current.filter((item) => item !== option);
}

async function submit() {
  if (!entry.value || submitting.value) return;
  submitting.value = true;
  error.value = "";
  try {
    result.value = await api.submitExam(entry.value.attemptId, answers);
  } catch (err) {
    error.value = err instanceof Error ? err.message : "试卷提交失败";
  } finally {
    submitting.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div v-if="loading" class="state-panel" aria-busy="true">正在核验考试资格并读取试卷...</div>
  <div v-else-if="error && !entry" class="state-panel error-state" role="alert">
    <strong>无法进入考试</strong><span>{{ error }}</span>
    <button class="button" type="button" @click="router.replace('/exams')">返回考试列表</button>
  </div>
  <template v-else-if="entry">
    <div class="page-head">
      <div>
        <span class="eyebrow">在线考试 / {{ entry.exam.courseTitle }}</span>
        <h1>{{ entry.exam.title }}</h1>
        <p>共 {{ entry.questions.length }} 题，已作答 {{ answeredCount }} 题。交卷后由服务端完成判分并保存结果。</p>
      </div>
      <button class="button primary" type="button" :disabled="submitting || Boolean(result)" @click="submit">
        {{ result ? "已交卷" : submitting ? "正在提交..." : "确认交卷" }}
      </button>
    </div>

    <p v-if="error" class="form-alert" role="alert">{{ error }}</p>
    <p v-if="result" class="success-banner" role="status">
      试卷提交成功，得分 {{ result.totalScore }}，结果为{{ result.passed ? "通过" : "未通过" }}。
    </p>
    <section v-if="result" class="panel feedback-panel">
      <div class="panel-head"><h2>自动评分与错题反馈</h2><span>{{ result.details.filter((item) => !item.correct).length }} 道待复习</span></div>
      <table class="data-table">
        <thead><tr><th>题号</th><th>结果</th><th>得分</th><th>反馈</th></tr></thead>
        <tbody>
          <tr v-for="(question, index) in entry.questions" :key="question.id">
            <td>第 {{ index + 1 }} 题</td>
            <td><span class="badge" :class="resultMap.get(question.id)?.correct ? 'green' : 'red'">{{ resultMap.get(question.id)?.correct ? "正确" : "错题" }}</span></td>
            <td>{{ resultMap.get(question.id)?.score ?? 0 }} / {{ question.score }}</td>
            <td>{{ resultMap.get(question.id)?.feedback ?? "已记录答题结果" }}<span v-if="resultMap.get(question.id)?.knowledgePoints?.length">（{{ resultMap.get(question.id)?.knowledgePoints?.join("、") }}）</span></td>
          </tr>
        </tbody>
      </table>
    </section>

    <div class="exam-layout">
      <section class="panel exam-paper">
        <div v-for="(question, index) in entry.questions" :id="`question-${question.id}`" :key="question.id" class="question-block">
          <div class="panel-head question-heading">
            <h2>第 {{ index + 1 }} 题 / {{ question.type === "multiple" ? "多选题" : question.type === "judge" ? "判断题" : "单选题" }}</h2>
            <span>{{ question.score }} 分</span>
          </div>
          <p class="question-stem">{{ question.stem }}</p>
          <label v-for="option in question.options" :key="option" class="answer-option">
            <input
              v-if="question.type === 'multiple'"
              type="checkbox"
              :checked="answers[question.id]?.includes(option)"
              :disabled="Boolean(result)"
              @change="toggleMultiple(question.id, option, $event)"
            />
            <input
              v-else
              type="radio"
              :name="question.id"
              :checked="answers[question.id]?.[0] === option"
              :disabled="Boolean(result)"
              @change="selectSingle(question.id, option)"
            />
            <span>{{ option }}</span>
          </label>
        </div>
      </section>

      <aside class="panel answer-sheet">
        <div class="panel-head"><h2>答题进度</h2><span>{{ answeredCount }} / {{ entry.questions.length }}</span></div>
        <div class="panel-body answer-grid">
          <a v-for="(question, index) in entry.questions" :key="question.id" :href="`#question-${question.id}`" :class="{ answered: answers[question.id]?.length }">
            {{ index + 1 }}
          </a>
        </div>
      </aside>
    </div>
  </template>
</template>
