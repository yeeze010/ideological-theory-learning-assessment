<script setup lang="ts">
import { computed, ref } from "vue";
const items = ref([
  { area: "学习端", text: "任务发布、章节学习、记录留痕闭环", done: true },
  { area: "考试端", text: "组卷、答题保存、交卷、自动阅卷闭环", done: true },
  { area: "阅卷端", text: "人工阅卷、复核、状态流转可追溯", done: true },
  { area: "评价端", text: "积分、个人/班级/院系统计口径一致", done: false },
  { area: "交付", text: "证书、学习报告、附件、部署文档齐备", done: false },
  { area: "工程", text: "构建、测试、Docker、GitHub CI 通过", done: false }
]);
const rate = computed(() => Math.round(items.value.filter(i=>i.done).length/items.value.length*100));
</script>
<template>
  <div class="page-head"><div><span class="eyebrow">管理分析端 / 交付闭环</span><h1>验收中心</h1><p>把产品能力、测试证据、部署材料和验收结论放在同一条交付链上。</p></div><button class="button primary">生成验收报告</button></div>
  <div class="metric-grid"><div class="metric"><label>总体就绪度</label><strong>{{ rate }}%</strong><small>按验收项实时计算</small></div><div class="metric"><label>功能模块</label><strong>14</strong><small>核心流程已覆盖</small></div><div class="metric"><label>测试用例</label><strong>48</strong><small>核心用例通过 42</small></div><div class="metric"><label>阻断问题</label><strong>0</strong><small>剩余 3 项待补证据</small></div></div>
  <div class="grid-2"><section class="panel"><div class="panel-head"><h2>验收清单</h2><span>勾选后自动更新就绪度</span></div><div class="panel-body"><div class="checklist"><label v-for="item in items" :key="item.text" class="check-item"><input v-model="item.done" type="checkbox"/><div><strong>{{ item.area }}</strong><span>{{ item.text }}</span></div><span class="badge" :class="item.done?'green':'orange'">{{ item.done?'已验证':'待验证' }}</span></label></div></div></section><section class="panel"><div class="panel-head"><h2>里程碑</h2><span>当前：M5 联调验收</span></div><div class="panel-body timeline"><div class="timeline-row"><time>06 月 01 日</time><i class="timeline-dot"></i><div><strong>M1 工程骨架</strong><span>前后端、共享类型与文档中心</span></div></div><div class="timeline-row"><time>06 月 03 日</time><i class="timeline-dot"></i><div><strong>M3 考试阅卷</strong><span>考试、自动阅卷与人工复核</span></div></div><div class="timeline-row"><time>06 月 05 日</time><i class="timeline-dot"></i><div><strong>M5 联调验收</strong><span>可视化系统、固定端口与构建验证</span></div></div></div></section></div>
</template>
