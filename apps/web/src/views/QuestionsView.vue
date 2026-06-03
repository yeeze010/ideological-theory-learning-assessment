<script setup lang="ts">
import type { QuestionSummary } from "@assessment/shared";
import { ElMessage } from "element-plus";
import { computed, onMounted, reactive, ref } from "vue";
import { api } from "@/api/client";

const questions = ref<QuestionSummary[]>([]);
const dialogVisible = ref(false);
const saving = ref(false);
const form = reactive({
  bankName: "理论基础题库",
  stem: "",
  optionA: "",
  optionB: "",
  optionC: "",
  optionD: "",
  answer: [] as string[],
  score: 20
});

const options = computed(() =>
  [form.optionA, form.optionB, form.optionC, form.optionD]
    .map((item) => item.trim())
    .filter(Boolean)
);

async function loadQuestions() {
  questions.value = await api.questions();
}

function openCreateDialog() {
  form.bankName = "理论基础题库";
  form.stem = "";
  form.optionA = "";
  form.optionB = "";
  form.optionC = "";
  form.optionD = "";
  form.answer = [];
  form.score = 20;
  dialogVisible.value = true;
}

async function createQuestion() {
  if (!form.stem.trim()) {
    ElMessage.warning("请填写题干");
    return;
  }
  if (options.value.length < 2) {
    ElMessage.warning("至少填写两个选项");
    return;
  }
  if (form.answer.length === 0) {
    ElMessage.warning("请选择正确答案");
    return;
  }
  saving.value = true;
  try {
    await api.createQuestion({
      bankName: form.bankName,
      stem: form.stem.trim(),
      options: options.value,
      answer: form.answer,
      score: Number(form.score)
    });
    ElMessage.success("试题已新增");
    dialogVisible.value = false;
    await loadQuestions();
  } finally {
    saving.value = false;
  }
}

onMounted(loadQuestions);
</script>

<template>
  <section class="page-title">
    <div>
      <h1>题库管理</h1>
      <p>维护题库、题型、难度、知识点和自动评分规则。</p>
    </div>
    <el-button type="primary" @click="openCreateDialog">新增试题</el-button>
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

  <el-dialog v-model="dialogVisible" title="新增试题" width="680px">
    <el-form label-position="top">
      <el-form-item label="题库">
        <el-input v-model="form.bankName" />
      </el-form-item>
      <el-form-item label="题干">
        <el-input v-model="form.stem" type="textarea" :rows="3" />
      </el-form-item>
      <el-form-item label="选项">
        <el-input v-model="form.optionA" placeholder="选项 A" />
        <el-input v-model="form.optionB" placeholder="选项 B" style="margin-top: 8px" />
        <el-input v-model="form.optionC" placeholder="选项 C" style="margin-top: 8px" />
        <el-input v-model="form.optionD" placeholder="选项 D" style="margin-top: 8px" />
      </el-form-item>
      <el-form-item label="正确答案">
        <el-checkbox-group v-model="form.answer">
          <el-checkbox v-for="option in options" :key="option" :label="option" :value="option" />
        </el-checkbox-group>
      </el-form-item>
      <el-form-item label="分值">
        <el-input-number v-model="form.score" :min="1" :max="100" style="width: 100%" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="createQuestion">保存</el-button>
    </template>
  </el-dialog>
</template>
