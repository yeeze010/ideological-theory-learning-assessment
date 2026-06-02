<script setup lang="ts">
import type { ExamEntry, ExamResult } from "@assessment/shared";
import { ElMessageBox } from "element-plus";
import { onMounted, reactive, ref } from "vue";
import { useRoute } from "vue-router";
import { api } from "@/api/client";

const route = useRoute();
const entry = ref<ExamEntry>();
const result = ref<ExamResult>();
const answers = reactive<Record<string, string[]>>({});

onMounted(async () => {
  entry.value = await api.examEntry(String(route.params.id));
});

function updateAnswer(questionId: string, value: string | string[]) {
  answers[questionId] = Array.isArray(value) ? value : [value];
}

async function submit() {
  await ElMessageBox.confirm("提交后将生成成绩并归档答案快照，是否继续？", "提交确认");
  if (!entry.value) return;
  result.value = await api.submitExam(entry.value.attemptId, answers);
}
</script>

<template>
  <section class="page-title">
    <div>
      <h1>{{ entry?.exam.title ?? "考试加载中" }}</h1>
      <p>{{ entry?.exam.courseTitle }} · 限时 {{ entry?.exam.durationMinutes }} 分钟 · 及格线 {{ entry?.exam.passScore }}</p>
    </div>
    <el-button type="danger" @click="submit">提交试卷</el-button>
  </section>

  <section v-if="result" class="panel">
    <div class="panel-header">
      <h2>考试结果</h2>
      <el-tag :type="result.passed ? 'success' : 'danger'">{{ result.passed ? "已通过" : "未通过" }}</el-tag>
    </div>
    <div class="metric-grid">
      <div class="metric">
        <label>总分</label>
        <strong>{{ result.totalScore }}</strong>
      </div>
      <div class="metric">
        <label>提交时间</label>
        <strong style="font-size: 18px">{{ new Date(result.submittedAt).toLocaleString() }}</strong>
      </div>
    </div>
  </section>

  <section v-else class="exam-layout">
    <div class="panel">
      <div v-for="(question, index) in entry?.questions" :key="question.id" class="question-block">
        <div class="question-stem">{{ index + 1 }}. {{ question.stem }}（{{ question.score }} 分）</div>
        <el-checkbox-group
          v-if="question.type === 'multiple'"
          :model-value="answers[question.id] ?? []"
          @update:model-value="(value: string[]) => updateAnswer(question.id, value)"
        >
          <el-checkbox v-for="option in question.options" :key="option" :label="option" :value="option" />
        </el-checkbox-group>
        <el-radio-group
          v-else
          :model-value="answers[question.id]?.[0]"
          @update:model-value="(value: string | number | boolean) => updateAnswer(question.id, String(value))"
        >
          <el-radio v-for="option in question.options" :key="option" :label="option" :value="option" />
        </el-radio-group>
      </div>
    </div>
    <aside class="panel">
      <div class="panel-header">
        <h2>答题状态</h2>
      </div>
      <div class="question-block">
        <p>已答：{{ Object.keys(answers).length }} / {{ entry?.questions.length ?? 0 }}</p>
        <p class="danger">离开页面前请提交试卷，演示版暂不保存草稿。</p>
      </div>
    </aside>
  </section>
</template>
