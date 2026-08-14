<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import type { ClassResultSummary } from "@assessment/shared";
import { api } from "@/api/client";
import { hasPermission } from "@/auth/roles";
import { useSessionStore } from "@/stores/session";

const session = useSessionStore();
const results = ref<ClassResultSummary[]>([]);
const loading = ref(true);
const saving = ref(false);
const error = ref("");
const success = ref("");
const showDialog = ref(false);
const selected = ref<ClassResultSummary | null>(null);
const form = reactive({ title: "", knowledgePoint: "", reason: "", priority: "high" as "low" | "medium" | "high" });

const canIntervene = computed(() => hasPermission(session.profile?.role, "intervention:create"));
const statusLabels = { not_started: "未开始", passed: "已通过", needs_support: "需补学" };

async function load() {
  loading.value = true;
  error.value = "";
  try {
    results.value = await api.classResults();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "班级结果读取失败";
  } finally {
    loading.value = false;
  }
}

function openIntervention(row: ClassResultSummary) {
  selected.value = row;
  Object.assign(form, {
    title: row.status === "not_started" ? "补学：完成首轮理论学习" : `补学：${row.latestExamTitle ?? "阶段考核"}错题复盘`,
    knowledgePoint: row.status === "not_started" ? "理论基础" : "错题知识点",
    reason: row.status === "not_started" ? "班级结果显示尚未提交考核，请完成课程学习和练习。" : `最近一次考核得分 ${row.latestScore ?? 0} 分，存在 ${row.wrongCount} 道错题。`,
    priority: row.status === "not_started" ? "medium" : "high"
  });
  showDialog.value = true;
}

async function createIntervention() {
  if (!selected.value || !form.title.trim() || !form.knowledgePoint.trim() || !form.reason.trim()) {
    error.value = "请填写完整的补学安排";
    return;
  }
  saving.value = true;
  error.value = "";
  success.value = "";
  try {
    const intervention = await api.createIntervention({
      learnerId: selected.value.learnerId,
      courseId: selected.value.latestCourseId,
      title: form.title.trim(),
      knowledgePoint: form.knowledgePoint.trim(),
      reason: form.reason.trim(),
      priority: form.priority
    });
    const row = results.value.find((item) => item.learnerId === intervention.learnerId);
    if (row) row.pendingTasks += 1;
    success.value = `${intervention.learnerName} 的补学任务已发起，学生端刷新后可见。`;
    showDialog.value = false;
  } catch (err) {
    error.value = err instanceof Error ? err.message : "补学发起失败";
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="page-head">
    <div>
      <span class="eyebrow">班级管理 / 学习干预</span>
      <h1>班级考核结果</h1>
      <p>查看当前角色数据范围内的学生考核结果，并为未开始或未通过的学生发起补学。</p>
    </div>
    <button class="button" type="button" :disabled="loading" @click="load">{{ loading ? "正在刷新..." : "刷新结果" }}</button>
  </div>

  <p v-if="success" class="success-banner" role="status">{{ success }}</p>
  <div v-if="loading" class="state-panel" aria-busy="true">正在读取班级考核结果...</div>
  <div v-else-if="error && !results.length" class="state-panel error-state" role="alert">
    <strong>班级结果未能载入</strong><span>{{ error }}</span><button class="button" type="button" @click="load">重新读取</button>
  </div>
  <section v-else class="panel data-panel">
    <div class="panel-head"><h2>学生结果</h2><span>{{ results.length }} 名学生</span></div>
    <div v-if="!results.length" class="empty-state"><strong>当前范围内还没有学生</strong><span>学生加入班级并提交考核后，结果会显示在这里。</span></div>
    <table v-else class="data-table">
      <thead><tr><th>学生</th><th>班级</th><th>最近考核</th><th>得分</th><th>掌握度</th><th>错题</th><th>待完成任务</th><th>状态</th><th>操作</th></tr></thead>
      <tbody>
        <tr v-for="row in results" :key="row.learnerId">
          <td><strong>{{ row.learnerName }}</strong></td>
          <td>{{ row.className }}</td>
          <td>{{ row.latestExamTitle ?? "尚未提交" }}</td>
          <td>{{ row.latestScore === null ? "-" : `${row.latestScore} 分` }}</td>
          <td>{{ row.mastery }}%</td>
          <td>{{ row.wrongCount }}</td>
          <td>{{ row.pendingTasks }}</td>
          <td><span class="badge" :class="row.status === 'passed' ? 'green' : row.status === 'needs_support' ? 'red' : 'orange'">{{ statusLabels[row.status] }}</span></td>
          <td><button v-if="canIntervene" class="text-button" type="button" @click="openIntervention(row)">{{ row.status === "passed" ? "安排巩固" : "发起补学" }}</button><span v-else class="muted-text">仅查看</span></td>
        </tr>
      </tbody>
    </table>
  </section>

  <p v-if="error && results.length" class="form-alert" role="alert">{{ error }}</p>

  <el-dialog v-model="showDialog" title="发起补学" width="min(640px, 92vw)">
    <form @submit.prevent="createIntervention">
      <div class="form-grid">
        <div class="field full"><label for="intervention-title">补学任务</label><input id="intervention-title" v-model="form.title" /></div>
        <div class="field"><label for="intervention-point">知识点</label><input id="intervention-point" v-model="form.knowledgePoint" /></div>
        <div class="field"><label for="intervention-priority">优先级</label><select id="intervention-priority" v-model="form.priority"><option value="high">高</option><option value="medium">中</option><option value="low">低</option></select></div>
        <div class="field full"><label for="intervention-reason">安排说明</label><textarea id="intervention-reason" v-model="form.reason" rows="4"></textarea></div>
      </div>
      <p v-if="error" class="form-alert" role="alert">{{ error }}</p>
      <div class="dialog-actions"><button class="button" type="button" @click="showDialog = false">取消</button><button class="button primary" type="submit" :disabled="saving">{{ saving ? "正在发起..." : "确认发起补学" }}</button></div>
    </form>
  </el-dialog>
</template>
