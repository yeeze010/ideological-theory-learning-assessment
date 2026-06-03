<script setup lang="ts">
import type { CourseSummary } from "@assessment/shared";
import { ElMessage } from "element-plus";
import { onMounted, reactive, ref } from "vue";
import { api } from "@/api/client";

const courses = ref<CourseSummary[]>([]);
const dialogVisible = ref(false);
const saving = ref(false);
const form = reactive({
  title: "",
  category: "必修课程",
  requiredMinutes: 60
});

async function loadCourses() {
  courses.value = await api.courses();
}

function openCreateDialog() {
  form.title = "";
  form.category = "必修课程";
  form.requiredMinutes = 60;
  dialogVisible.value = true;
}

async function createCourse() {
  if (!form.title.trim()) {
    ElMessage.warning("请填写课程名称");
    return;
  }
  saving.value = true;
  try {
    await api.createCourse({
      title: form.title.trim(),
      category: form.category,
      requiredMinutes: Number(form.requiredMinutes)
    });
    ElMessage.success("课程已创建");
    dialogVisible.value = false;
    await loadCourses();
  } finally {
    saving.value = false;
  }
}

onMounted(loadCourses);
</script>

<template>
  <section class="page-title">
    <div>
      <h1>课程学习</h1>
      <p>管理课程、章节、学习任务和学员完成情况。</p>
    </div>
    <el-button type="primary" @click="openCreateDialog">新建课程</el-button>
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

  <el-dialog v-model="dialogVisible" title="新建课程" width="520px">
    <el-form label-position="top">
      <el-form-item label="课程名称">
        <el-input v-model="form.title" placeholder="例如：党史学习教育专题" />
      </el-form-item>
      <el-form-item label="课程分类">
        <el-select v-model="form.category" style="width: 100%">
          <el-option label="必修课程" value="必修课程" />
          <el-option label="理论专题" value="理论专题" />
          <el-option label="专题教育" value="专题教育" />
        </el-select>
      </el-form-item>
      <el-form-item label="要求学习分钟">
        <el-input-number v-model="form.requiredMinutes" :min="10" :step="10" style="width: 100%" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="createCourse">保存</el-button>
    </template>
  </el-dialog>
</template>
