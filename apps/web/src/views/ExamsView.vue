<script setup lang="ts">
import type { ExamPlanSummary } from "@assessment/shared";
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { api } from "@/api/client";

const router = useRouter();
const exams = ref<ExamPlanSummary[]>([]);

onMounted(async () => {
  exams.value = await api.exams();
});
</script>

<template>
  <section class="page-title">
    <div>
      <h1>在线考试</h1>
      <p>考试计划、答题入口、自动保存、提交评分和成绩发布。</p>
    </div>
    <el-button type="primary">创建考试</el-button>
  </section>
  <section class="panel">
    <el-table :data="exams" stripe>
      <el-table-column prop="title" label="考试名称" min-width="220" />
      <el-table-column prop="courseTitle" label="关联课程" min-width="240" />
      <el-table-column prop="durationMinutes" label="限时" width="90" />
      <el-table-column prop="passScore" label="及格线" width="90" />
      <el-table-column label="状态" width="110">
        <template #default="{ row }">
          <el-tag type="success">{{ row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="130">
        <template #default="{ row }">
          <el-button type="primary" link @click="router.push(`/exams/${row.id}/attempt`)">进入考试</el-button>
        </template>
      </el-table-column>
    </el-table>
  </section>
</template>
