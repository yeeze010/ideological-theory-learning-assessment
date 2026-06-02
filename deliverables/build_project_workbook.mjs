import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const root = path.dirname(decodeURIComponent(new URL(import.meta.url).pathname)).replace(/^\/([A-Za-z]:)/, "$1");
const outputDir = path.join(root, "outputs");
const qaDir = path.join(root, "qa");
await fs.mkdir(outputDir, { recursive: true });
await fs.mkdir(qaDir, { recursive: true });

const wb = Workbook.create();

function addSheet(name) {
  const sheet = wb.worksheets.add(name);
  sheet.showGridLines = false;
  return sheet;
}

function writeTable(sheet, range, rows, tableName) {
  const r = sheet.getRange(range);
  r.values = rows;
  r.format = {
    font: { name: "Microsoft YaHei", size: 10, color: "#111827" },
    borders: { preset: "all", style: "thin", color: "#DADCE0" },
    wrapText: true,
    verticalAlignment: "Top",
  };
  const header = sheet.getRangeByIndexes(r.rowIndex, r.columnIndex, 1, rows[0].length);
  header.format = {
    fill: "#1F4D78",
    font: { bold: true, color: "#FFFFFF", name: "Microsoft YaHei", size: 10 },
    borders: { preset: "all", style: "thin", color: "#1F4D78" },
    horizontalAlignment: "Center",
    verticalAlignment: "Center",
  };
  try {
    const table = sheet.tables.add(range, true, tableName);
    table.style = "TableStyleMedium2";
    table.showFilterButton = true;
  } catch (_) {
  }
  sheet.freezePanes.freezeRows(1);
  return r;
}

function title(sheet, text, subtitle = "") {
  sheet.getRange("A1:H1").merge();
  sheet.getRange("A1").values = [[text]];
  sheet.getRange("A1").format = {
    fill: "#FFFFFF",
    font: { bold: true, size: 18, color: "#0B2545", name: "Microsoft YaHei" },
  };
  if (subtitle) {
    sheet.getRange("A2:H2").merge();
    sheet.getRange("A2").values = [[subtitle]];
    sheet.getRange("A2").format = {
      font: { size: 10, color: "#555555", name: "Microsoft YaHei" },
    };
  }
}

function setWidths(sheet, widths) {
  widths.forEach((w, i) => {
    sheet.getRangeByIndexes(0, i, 1, 1).format.columnWidthPx = w;
  });
}

const overview = addSheet("项目总览");
title(overview, "思想理论学习考核平台 - 项目管理总览", "版本 V1.0 | 适用于立项、开发、测试、部署与验收跟踪");
overview.getRange("A4:C9").values = [
  ["项目周期", "12 周", "从需求冻结到上线验收"],
  ["推荐栈", "Vue 3 + NestJS", "同语言栈，适合后台管理与考试业务"],
  ["数据库", "PostgreSQL", "强事务、复杂查询、报表聚合"],
  ["缓存", "Redis", "验证码、临时答题、报表缓存、队列"],
  ["文件存储", "MinIO", "课件、视频、证书、导入模板"],
  ["部署", "Docker + Nginx", "容器化、反向代理、HTTPS、灰度回滚"],
];
overview.getRange("A4:C9").format = {
  borders: { preset: "all", style: "thin", color: "#DADCE0" },
  font: { name: "Microsoft YaHei", size: 10 },
  wrapText: true,
};
overview.getRange("A4:A9").format = { fill: "#E8EEF5", font: { bold: true, color: "#0B2545", name: "Microsoft YaHei" } };
setWidths(overview, [130, 160, 520]);

const milestoneRows = [
  ["里程碑", "周期", "核心目标", "关键交付物", "验收口径", "状态"],
  ["M1 立项与原型确认", "第1周", "需求冻结、原型确认、数据模型草案", "需求规格、原型、接口草案", "业务方确认范围和页面清单", "待启动"],
  ["M2 基础框架与权限", "第2-3周", "前后端脚手架、登录、组织人员、RBAC", "基础框架、权限接口、菜单", "不同角色菜单与数据范围正确", "待启动"],
  ["M3 课程题库与学习", "第4-6周", "课程、章节、资源、题库、学习进度", "课程模块、题库模块、学习端", "可发布课程并记录进度", "待启动"],
  ["M4 考试评分与证书", "第7-9周", "考试计划、答题、评分、成绩、证书", "考试模块、评分模块、证书", "可完成考试到成绩归档闭环", "待启动"],
  ["M5 报表通知与运维", "第10-11周", "看板、通知、审计、导出、配置", "统计报表、通知、审计日志", "报表可导出且审计可追溯", "待启动"],
  ["M6 联调测试与验收", "第12周", "缺陷修复、压测、安全测试、上线演练", "验收报告、部署记录", "核心用例全通过，生产可回滚", "待启动"],
];
const ms = addSheet("开发里程碑");
writeTable(ms, "A1:F7", milestoneRows, "MilestoneTable");
setWidths(ms, [170, 90, 260, 230, 260, 90]);

const taskRows = [
  ["WBS", "模块", "任务", "角色", "负责人建议", "开始周", "结束周", "优先级", "依赖", "验收结果"],
  ["1.1", "产品", "需求规格说明书与验收矩阵", "产品经理", "PM/产品", 1, 1, "P0", "无", "待验收"],
  ["1.2", "产品", "前后台原型和页面流转", "产品经理/UI", "产品+设计", 1, 1, "P0", "1.1", "待验收"],
  ["2.1", "基础架构", "NestJS 项目结构、环境配置、健康检查", "后端", "后端A", 2, 2, "P0", "1.1", "待验收"],
  ["2.2", "基础架构", "Vue 3 管理后台框架、路由、布局", "前端", "前端A", 2, 2, "P0", "1.2", "待验收"],
  ["2.3", "权限", "登录、JWT、RBAC、菜单权限、数据范围", "后端/前端", "后端A+前端A", 2, 3, "P0", "2.1/2.2", "待验收"],
  ["3.1", "组织人员", "组织树、人员导入、角色分配", "后端/前端", "后端B+前端A", 3, 4, "P0", "2.3", "待验收"],
  ["3.2", "课程资源", "课程、章节、资源上传、发布审核", "后端/前端", "后端B+前端B", 4, 5, "P0", "2.3", "待验收"],
  ["3.3", "学习中心", "我的课程、章节学习、学习进度", "前端/后端", "前端B+后端B", 5, 6, "P0", "3.2", "待验收"],
  ["4.1", "题库", "试题 CRUD、导入校验、题目标签", "后端/前端", "后端A+前端A", 4, 6, "P0", "2.3", "待验收"],
  ["4.2", "试卷", "固定试卷、随机组卷、分值规则", "后端", "后端A", 6, 7, "P0", "4.1", "待验收"],
  ["5.1", "考试", "考试计划、报名范围、考试入口", "后端/前端", "后端A+前端B", 7, 8, "P0", "4.2/3.1", "待验收"],
  ["5.2", "答题", "答题页、自动保存、倒计时、提交确认", "前端/后端", "前端B+后端A", 8, 9, "P0", "5.1", "待验收"],
  ["5.3", "成绩", "自动评分、人工阅卷、成绩发布、证书", "后端/前端", "后端B+前端A", 8, 9, "P0", "5.2", "待验收"],
  ["6.1", "报表", "学习进度、通过率、组织排名、题目分析", "后端/前端", "后端B+前端A", 10, 11, "P1", "3.3/5.3", "待验收"],
  ["6.2", "通知审计", "站内信、提醒、操作审计、导出记录", "后端/前端", "后端A+前端B", 10, 11, "P1", "2.3", "待验收"],
  ["7.1", "测试", "接口测试、功能测试、性能测试、安全测试", "测试", "测试工程师", 6, 12, "P0", "各模块完成", "待验收"],
  ["7.2", "部署", "Docker、Nginx、备份、上线演练", "DevOps", "DevOps", 10, 12, "P0", "核心模块完成", "待验收"],
];
const tasks = addSheet("任务分工表");
writeTable(tasks, `A1:J${taskRows.length}`, taskRows, "TaskAssignmentTable");
setWidths(tasks, [70, 110, 260, 110, 150, 70, 70, 80, 130, 90]);

const testRows = [
  ["用例ID", "模块", "场景", "前置条件", "测试步骤", "预期结果", "优先级", "类型"],
  ["TC-AUTH-001", "认证权限", "管理员登录成功", "账号已启用", "输入正确账号密码并登录", "进入后台首页，菜单按角色展示", "P0", "功能"],
  ["TC-AUTH-002", "认证权限", "学员访问后台受限", "学员账号存在", "学员请求后台管理接口", "返回 403 或无权限菜单", "P0", "安全"],
  ["TC-ORG-001", "组织人员", "批量导入人员", "存在导入模板", "上传含合法人员的 Excel", "导入成功并生成账号", "P0", "功能"],
  ["TC-COURSE-001", "课程资源", "发布课程任务", "课程含章节与资源", "管理员发布学习任务", "学员首页出现待学习任务", "P0", "端到端"],
  ["TC-LEARN-001", "学习中心", "章节学习进度记录", "学员有课程权限", "观看章节并完成测验", "进度、学习时长、完成状态正确", "P0", "功能"],
  ["TC-QB-001", "题库", "试题导入错误提示", "Excel 含错误行", "上传题库模板", "系统提示错误行和错误原因", "P0", "功能"],
  ["TC-PAPER-001", "试卷", "随机组卷按规则抽题", "题库题量充足", "配置难度和题型规则", "试卷题型、数量、分值满足规则", "P0", "功能"],
  ["TC-EXAM-001", "考试", "考试入口时间限制", "考试未开始", "学员访问考试入口", "提示未开始，不能答题", "P0", "功能"],
  ["TC-EXAM-002", "考试", "答题自动保存", "考试进行中", "作答后刷新页面", "已答内容恢复，审计记录存在", "P0", "端到端"],
  ["TC-EXAM-003", "考试", "重复提交幂等", "考试已提交", "重复点击提交或重复请求", "只生成一份成绩，不重复评分", "P0", "安全"],
  ["TC-SCORE-001", "成绩", "客观题自动评分", "提交含客观题答案", "提交考试", "分数与答案规则一致", "P0", "功能"],
  ["TC-CERT-001", "证书", "通过后生成证书", "成绩已发布且通过", "查看证书", "证书可预览、下载、归档", "P1", "功能"],
  ["TC-REPORT-001", "统计报表", "组织通过率统计", "已有成绩数据", "查看组织排名报表", "通过率与明细成绩一致", "P0", "数据"],
  ["TC-AUDIT-001", "审计", "导出记录留痕", "管理员有导出权限", "导出成绩报表", "审计日志记录操作者、IP、时间", "P1", "安全"],
  ["TC-PERF-001", "性能", "500 并发答题保存", "压测环境准备", "模拟 500 并发保存答案", "错误率低于 1%，P95 小于 500ms", "P0", "性能"],
];
const tests = addSheet("测试用例表");
writeTable(tests, `A1:H${testRows.length}`, testRows, "TestCaseTable");
setWidths(tests, [120, 110, 190, 180, 260, 260, 70, 90]);

const acceptRows = [
  ["验收项", "标准", "验证方式", "通过条件", "负责人"],
  ["功能闭环", "课程创建到考试成绩归档完整", "端到端演示", "核心流程无阻断缺陷", "项目经理"],
  ["权限控制", "菜单、按钮、接口、数据范围均受控", "角色抽检", "学员无后台权限，管理员数据不越界", "测试工程师"],
  ["报表准确", "学习完成率、通过率、排名与明细一致", "数据核对", "抽样误差为 0", "产品经理"],
  ["性能指标", "常规请求 P95 < 500ms，报表缓存 < 1s", "压测报告", "达到指标且无严重慢查询", "后端负责人"],
  ["安全合规", "无高危越权、注入、XSS、文件泄露", "安全测试", "高危问题清零", "测试工程师"],
  ["部署运维", "Docker/Nginx/备份/回滚可用", "上线演练", "可回滚、备份可恢复", "DevOps"],
  ["文档交付", "需求、设计、测试、部署、验收材料齐备", "文档检查", "版本一致，签字确认", "项目经理"],
];
const accept = addSheet("验收清单");
writeTable(accept, `A1:E${acceptRows.length}`, acceptRows, "AcceptanceTable");
setWidths(accept, [130, 290, 120, 270, 110]);

const riskRows = [
  ["风险", "概率", "影响", "应对措施", "触发信号", "责任人"],
  ["需求边界扩张", "中", "高", "建立变更单，MVP 优先保证学习考试闭环", "新增模块超过排期", "项目经理"],
  ["考试并发压力", "中", "高", "Redis 临时答案、批量落库、压测提前介入", "答题保存慢或丢失", "后端负责人"],
  ["题库导入质量不稳定", "高", "中", "模板校验、错误行提示、重复题检测", "导入失败率高", "产品经理"],
  ["权限数据范围复杂", "中", "高", "统一租户和组织过滤，接口层强制校验", "跨组织可见数据", "后端负责人"],
  ["文件访问泄露", "低", "高", "私有桶、短签名 URL、下载审计", "未授权下载成功", "DevOps"],
  ["验收材料滞后", "中", "中", "里程碑同步更新文档和用例", "上线前补材料", "项目经理"],
];
const risks = addSheet("风险台账");
writeTable(risks, `A1:F${riskRows.length}`, riskRows, "RiskRegisterTable");
setWidths(risks, [160, 70, 70, 300, 200, 110]);

const sheetsToRender = ["项目总览", "开发里程碑", "任务分工表", "测试用例表", "验收清单", "风险台账"];
for (const name of sheetsToRender) {
  const preview = await wb.render({ sheetName: name, autoCrop: "all", scale: 1, format: "png" });
  await fs.writeFile(path.join(qaDir, `${name}.png`), new Uint8Array(await preview.arrayBuffer()));
}

const errors = await wb.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 100 },
  summary: "final formula error scan",
});
console.log(errors.ndjson);

const output = await SpreadsheetFile.exportXlsx(wb);
const outPath = path.join(outputDir, "思想理论学习考核平台-项目排期任务测试验收表.xlsx");
await output.save(outPath);
console.log(outPath);
