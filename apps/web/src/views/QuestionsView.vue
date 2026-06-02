<script setup lang="ts">
import type { QuestionSummary } from "@assessment/shared";
import { onMounted, ref } from "vue";
import { api } from "@/api/client";

const questions = ref<QuestionSummary[]>([]);

onMounted(async () => {
  questions.value = await api.questions();
});
</script>

<template>
  <section class="page-title">
    <div>
      <h1>题库管理</h1>
      <p>维护题库、题型、难度、知识点和自动评分规则。</p>
    </div>
    <el-button type="primary">导入试题</el-button>
  </section>
  <section class="panel">
    <el-table :data="questions" stripe>
      <el-table-column prop="bankName" label="题库" width="150" />
      <el-table-column prop="stem" label="题干" min-width="360" />
      <el-table-column prop="type" label="题型" width="100" />
      <el-table-column prop="difficulty" label="难度" width="100" />
      <el-table-column prop="score" label="分值" width="80" />
    </el-table>
  </section>
</template>
