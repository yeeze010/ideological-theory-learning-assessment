<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { CourseSummary } from "@assessment/shared";
import { api } from "@/api/client";
import { hasPermission } from "@/auth/roles";
import { useSessionStore } from "@/stores/session";

const session = useSessionStore();
const route = useRoute();
const router = useRouter();
const courses = ref<CourseSummary[]>([]);
const loading = ref(true);
const saving = ref(false);
const publishingId = ref("");
const error = ref("");
const success = ref("");
const showCreate = ref(false);
const form = reactive({ title: "", category: "", requiredMinutes: 60 });

const canCreate = computed(() => hasPermission(session.profile?.role, "course:create"));
const canPublish = computed(() => hasPermission(session.profile?.role, "course:publish"));

async function load() {
  loading.value = true;
  error.value = "";
  try {
    courses.value = await api.courses();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "课程数据读取失败";
  } finally {
    loading.value = false;
  }
}

async function createCourse() {
  if (!form.title.trim() || !form.category.trim()) {
    error.value = "请填写课程名称和课程类别";
    return;
  }
  saving.value = true;
  error.value = "";
  success.value = "";
  try {
    const created = await api.createCourse({
      title: form.title.trim(),
      category: form.category.trim(),
      requiredMinutes: Number(form.requiredMinutes)
    });
    courses.value.unshift(created);
    success.value = `课程“${created.title}”已创建，当前状态为草稿。`;
    showCreate.value = false;
    Object.assign(form, { title: "", category: "", requiredMinutes: 60 });
  } catch (err) {
    error.value = err instanceof Error ? err.message : "课程创建失败";
  } finally {
    saving.value = false;
  }
}

async function publishCourse(course: CourseSummary) {
  publishingId.value = course.id;
  error.value = "";
  success.value = "";
  try {
    const published = await api.publishCourse(course.id);
    Object.assign(course, published);
    success.value = `学习任务“${published.title}”已发布，符合范围的学生已收到待学任务。`;
  } catch (err) {
    error.value = err instanceof Error ? err.message : "学习任务发布失败";
  } finally {
    publishingId.value = "";
  }
}

onMounted(async () => {
  await load();
  if (route.query.create === "1" && canCreate.value) {
    showCreate.value = true;
    void router.replace({ path: "/courses" });
  }
});
</script>

<template>
  <div class="page-head">
    <div>
      <span class="eyebrow">学习管理 / 课程</span>
      <h1>课程与学习任务</h1>
      <p>查看当前角色可访问的课程，并由授权人员创建课程草稿。</p>
    </div>
    <button v-if="canCreate" class="button primary" type="button" @click="showCreate = true">创建课程</button>
    <button v-else class="button" type="button" :disabled="loading" @click="load">刷新课程</button>
  </div>

  <p v-if="success" class="success-banner" role="status">{{ success }}</p>
  <div v-if="loading" class="state-panel" aria-busy="true">正在读取课程列表...</div>
  <div v-else-if="error && !courses.length" class="state-panel error-state" role="alert">
    <strong>课程列表未能载入</strong><span>{{ error }}</span>
    <button class="button" type="button" @click="load">重新读取</button>
  </div>
  <section v-else class="panel data-panel">
    <div class="panel-head"><h2>课程清单</h2><span>{{ courses.length }} 门课程</span></div>
    <div v-if="!courses.length" class="empty-state">
      <strong>当前范围内没有课程</strong>
      <span v-if="canCreate">创建第一门课程后会显示在这里。</span>
      <span v-else>请联系课程管理员分配课程。</span>
    </div>
    <table v-else class="data-table">
       <thead><tr><th>课程名称</th><th>类别</th><th>必修时长</th><th>学习人数</th><th>完成率</th><th>状态</th><th>操作</th></tr></thead>
      <tbody>
        <tr v-for="course in courses" :key="course.id">
          <td><strong>{{ course.title }}</strong></td>
          <td>{{ course.category }}</td>
          <td>{{ course.requiredMinutes }} 分钟</td>
          <td>{{ course.learnerCount }}</td>
          <td><div class="progress" :aria-label="`完成率 ${course.completionRate}%`"><i :style="{ width: course.completionRate + '%' }"></i></div></td>
           <td><span class="badge" :class="course.status === 'published' ? 'green' : course.status === 'draft' ? 'orange' : ''">{{ course.status === "published" ? "已发布" : course.status === "draft" ? "草稿" : "已归档" }}</span></td>
           <td><button v-if="canPublish && course.status === 'draft'" class="text-button" type="button" :disabled="publishingId === course.id" @click="publishCourse(course)">{{ publishingId === course.id ? "正在发布..." : "发布任务" }}</button><span v-else class="muted-text">{{ course.status === "published" ? "已生效" : "不可操作" }}</span></td>
        </tr>
      </tbody>
    </table>
  </section>

  <el-dialog v-model="showCreate" title="创建课程" width="min(620px, 92vw)">
    <form @submit.prevent="createCourse">
      <div class="form-grid">
        <div class="field full">
          <label for="course-title">课程名称</label>
          <input id="course-title" v-model="form.title" autocomplete="off" />
        </div>
        <div class="field">
          <label for="course-category">课程类别</label>
          <input id="course-category" v-model="form.category" autocomplete="off" />
        </div>
        <div class="field">
          <label for="course-minutes">必修时长（分钟）</label>
          <input id="course-minutes" v-model.number="form.requiredMinutes" type="number" min="1" />
        </div>
      </div>
      <p v-if="error" class="form-alert" role="alert">{{ error }}</p>
      <div class="dialog-actions">
        <button class="button" type="button" @click="showCreate = false">取消</button>
        <button class="button primary" type="submit" :disabled="saving">{{ saving ? "正在创建..." : "创建课程草稿" }}</button>
      </div>
    </form>
  </el-dialog>
</template>
