<script setup lang="ts">
import { ref } from "vue";
const show = ref(false); const created = ref(false);
const form = ref({bank:"新时代中国特色社会主义题库",type:"单选题",difficulty:"中等",score:5,stem:""});
const questions = ref([
  {bank:"新时代中国特色社会主义题库",stem:"新时代我国社会主要矛盾是什么？",type:"单选题",difficulty:"基础",score:5,state:"已审核"},
  {bank:"马克思主义基本原理题库",stem:"结合实践说明认识运动的基本规律。",type:"简答题",difficulty:"较难",score:15,state:"待审核"},
  {bank:"党史学习教育题库",stem:"新民主主义革命胜利的基本经验包括哪些？",type:"多选题",difficulty:"中等",score:10,state:"已审核"}
]);
function save(){questions.value.unshift({...form.value,state:"待审核"});created.value=true;show.value=false;form.value.stem="";}
</script>
<template>
  <div class="page-head"><div><span class="eyebrow">考试端 / 题库资产</span><h1>题库与组卷</h1><p>题目审核、难度结构与组卷策略共同保障考试质量。</p></div><button class="button primary" @click="show=true">新增试题</button></div>
  <div class="metric-grid"><div class="metric"><label>题目总量</label><strong>1,286</strong><small>本周新增 42</small></div><div class="metric"><label>已审核</label><strong>94%</strong><small>76 题待审核</small></div><div class="metric"><label>组卷方案</label><strong>18</strong><small>固定卷 12 · 随机卷 6</small></div><div class="metric"><label>平均难度</label><strong>0.62</strong><small>结构处于合理区间</small></div></div>
  <section class="panel"><div class="panel-head"><h2>题目清单</h2><span v-if="created" class="badge green">新试题已进入审核流</span><span v-else>支持题型、难度和审核状态筛选</span></div><table class="data-table"><thead><tr><th>题库</th><th>题干</th><th>题型</th><th>难度</th><th>分值</th><th>状态</th></tr></thead><tbody><tr v-for="q in questions" :key="q.stem"><td>{{q.bank}}</td><td><strong>{{q.stem}}</strong></td><td>{{q.type}}</td><td>{{q.difficulty}}</td><td>{{q.score}}</td><td><span class="badge" :class="q.state==='已审核'?'green':'orange'">{{q.state}}</span></td></tr></tbody></table></section>
  <el-dialog v-model="show" title="新增试题" width="680px"><div class="form-grid"><div class="field full"><label>所属题库</label><select v-model="form.bank"><option>新时代中国特色社会主义题库</option><option>马克思主义基本原理题库</option></select></div><div class="field"><label>题型</label><select v-model="form.type"><option>单选题</option><option>多选题</option><option>简答题</option></select></div><div class="field"><label>难度</label><select v-model="form.difficulty"><option>基础</option><option>中等</option><option>较难</option></select></div><div class="field full"><label>题干</label><textarea v-model="form.stem" rows="4" placeholder="请输入完整题干"></textarea></div><div class="field"><label>分值</label><input v-model="form.score" type="number"/></div></div><div class="dialog-actions"><button class="button" @click="show=false">取消</button><button class="button primary" :disabled="!form.stem" @click="save">保存并送审</button></div></el-dialog>
</template>
