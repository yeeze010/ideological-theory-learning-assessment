<script setup lang="ts">
import { computed, ref } from "vue";
const props = defineProps<{ mode: "records" | "marking" }>();
const statuses = ref(["待分配", "阅卷中", "待复核", "已完成"]);
const active = ref(1);
const records = [
  { name: "王明", task: "新时代中国特色社会主义理论专题", progress: 92, time: "168 分钟", state: "已完成" },
  { name: "李华", task: "党史学习教育必修课", progress: 76, time: "121 分钟", state: "学习中" },
  { name: "张宁", task: "马克思主义基本原理", progress: 48, time: "74 分钟", state: "需提醒" }
];
const title = computed(() => props.mode === "records" ? "学习记录" : "阅卷工作台");
function advance() { active.value = Math.min(active.value + 1, statuses.value.length - 1); }
</script>
<template>
  <div class="page-head"><div><span class="eyebrow">{{ mode === "records" ? "学习端 / 过程留痕" : "阅卷端 / 状态流转" }}</span><h1>{{ title }}</h1><p>{{ mode === "records" ? "从章节进度、有效时长和任务达成情况观察学习质量。" : "主观题分配、评分、复核和发布形成完整责任链。" }}</p></div><button v-if="mode==='marking'" class="button primary" @click="advance">推进当前批次</button></div>
  <template v-if="mode==='records'">
    <div class="metric-grid"><div class="metric"><label>今日有效学习</label><strong>486h</strong><small>较昨日 +12.6%</small></div><div class="metric"><label>任务完成率</label><strong>82%</strong><small>目标 85%</small></div><div class="metric"><label>需提醒学生</label><strong>24</strong><small class="danger">其中 7 人临近截止</small></div><div class="metric"><label>章节平均完成</label><strong>6.8</strong><small>共 9 个必修章节</small></div></div>
    <section class="panel"><div class="panel-head"><h2>实时学习记录</h2><span>按最近学习行为更新</span></div><table class="data-table"><thead><tr><th>学生</th><th>学习任务</th><th>有效时长</th><th>进度</th><th>状态</th></tr></thead><tbody><tr v-for="r in records" :key="r.name"><td><strong>{{ r.name }}</strong></td><td>{{ r.task }}</td><td>{{ r.time }}</td><td><div class="progress"><i :style="{width:r.progress+'%'}"></i></div></td><td><span class="badge" :class="r.state==='已完成'?'green':r.state==='需提醒'?'red':'orange'">{{ r.state }}</span></td></tr></tbody></table></section>
  </template>
  <template v-else>
    <div class="flow-track"><div v-for="(s,i) in statuses" :key="s" class="flow-step"><b>0{{ i+1 }}</b><strong>{{ s }}</strong><span>{{ i < active ? "已完成" : i === active ? "当前状态" : "等待流转" }}</span></div></div>
    <div class="grid-2"><section class="panel"><div class="panel-head"><h2>当前阅卷任务</h2><span>主观题第 3 题 · 15 分</span></div><div class="panel-body"><p><strong>题目：</strong>结合新时代青年使命，阐述理论学习与实践担当的关系。</p><div class="field"><label>学生作答</label><textarea rows="7" readonly>理论学习帮助青年建立正确的价值判断，并将认识转化为服务社会、担当责任的行动。实践又能检验和深化理论认识，二者相互促进。</textarea></div><div class="form-grid" style="margin-top:14px"><div class="field"><label>评分</label><input value="13" type="number" /></div><div class="field"><label>评语</label><input value="观点明确，实践联系可进一步展开" /></div></div></div></section><section class="panel"><div class="panel-head"><h2>批次进度</h2><span>2026 春季期末考试</span></div><div class="panel-body"><div class="metric" style="border:0;padding:8px 0"><label>已阅 / 总量</label><strong>268 / 360</strong></div><div class="progress"><i style="width:74%"></i></div><p style="color:var(--muted);font-size:12px">当前处于“{{ statuses[active] }}”，完成评分后进入待复核。</p></div></section></div>
  </template>
</template>
