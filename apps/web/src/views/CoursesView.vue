<script setup lang="ts">
import type { CourseSummary } from "@assessment/shared";
import { onMounted, ref } from "vue";
import { api } from "@/api/client";

const courses = ref<CourseSummary[]>([]);

onMounted(async () => {
  courses.value = await api.courses();
});
</script>

<template>
  <section class="page-title">
    <div>
      <h1>课程学习</h1>
      <p>管理课程、章节、学习任务和学员完成情况。</p>
    </div>
    <el-button type="primary">新建课程</el-button>
  </section>
  <section class="panel">
    <el-table :data="courses" stripe>
      <el-table-column prop="title" label="课程名称" min-width="260" />
      <el-table-column prop="category" label="分类" width="130" />
      <el-table-column prop="requiredMinutes" label="要求分钟" width="110" />
      <el-table-column prop="learnerCount" label="学员数" width="100" />
      <el-table-column label="完成率" width="180">
        <template #default="{ row }">
          <el-progress :percentage="row.completionRate" />
        </template>
      </el-table-column>
      <el-table-column label="状态" width="110">
        <template #default="{ row }">
          <el-tag :type="row.status === 'published' ? 'success' : 'info'">{{ row.status }}</el-tag>
        </template>
      </el-table-column>
    </el-table>
  </section>
</template>
