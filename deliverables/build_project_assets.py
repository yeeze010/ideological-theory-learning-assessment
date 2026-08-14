from pathlib import Path
from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.shared import Inches, Pt, RGBColor
from docx.oxml import OxmlElement
from docx.oxml.ns import qn


ROOT = Path(__file__).resolve().parent
DIAGRAM_DIR = ROOT / "diagrams"
OUT_DIR = ROOT / "outputs"
DIAGRAM_DIR.mkdir(parents=True, exist_ok=True)
OUT_DIR.mkdir(parents=True, exist_ok=True)


PROJECT_NAME = "思政理论学习考核评价系统"


sections = [
    (
        "1. 项目概述",
        [
            "本项目建设一个面向高校、党政机关、企事业单位的思想理论学习、考试测评、过程监督与结果归档平台。系统覆盖学习资源管理、课程学习、题库建设、考试组织、自动评分、证书归档、统计分析、组织督学和移动端学习等核心场景。",
            "平台以统一身份、组织架构、学习任务、考试任务和数据看板为主线，支持多租户/多组织分级管理，保证课程内容、题库、考试策略、成绩数据、学习档案均可追溯、可审计、可验收。",
            "推荐技术栈：前端 Vue 3 + TypeScript + Vite + Pinia + Vue Router + Element Plus；后端 NestJS + TypeScript；数据库 PostgreSQL；缓存 Redis；文件存储 MinIO；部署 Docker + Nginx。选择 NestJS 的原因是与前端同语言栈、模块化清晰、适合 RBAC、考试任务、异步队列和后台管理系统快速迭代。"
        ],
    ),
    (
        "2. 建设目标",
        [
            "目标一：建立统一学习门户，支撑学员在线学习、资料下载、视频学习、章节测验、正式考试、成绩查询和证书查看。",
            "目标二：建立管理后台，支撑组织、角色、人员、课程、题库、考试、通知、文件、统计报表和系统配置统一管理。",
            "目标三：建立可量化考核机制，支持学习时长、课程完成率、考试通过率、补考次数、组织排名、个人档案等指标统计。",
            "目标四：建立安全合规的数据闭环，支持登录审计、操作审计、考试防作弊策略、文件访问控制、数据备份和验收留痕。",
            "目标五：提供可持续扩展能力，后续可接入单点登录、移动 App、小程序、LDAP/钉钉/企业微信、AI 题目推荐和学习画像。"
        ],
    ),
    (
        "3. 用户角色",
        [
            "平台超级管理员：维护租户、系统参数、全局字典、存储配置、审计日志和平台级统计。",
            "组织管理员：维护本单位组织架构、人员账号、角色授权、学习任务和考试任务。",
            "课程管理员：维护课程、章节、学习资料、视频、课件、知识点和发布状态。",
            "题库管理员：维护题库、题型、试题、答案、解析、难度、知识点和导入导出。",
            "监考/督学人员：查看考试过程、异常记录、学习进度、提醒待办和组织完成情况。",
            "学员：完成课程学习、章节测验、正式考试、补考、成绩查询、证书下载和个人学习档案查看。",
            "审计人员：查看关键操作、登录记录、成绩变更记录、文件访问日志和导出记录。"
        ],
    ),
    (
        "4. 功能模块清单",
        [
            "统一认证与权限：账号密码登录、验证码、JWT、刷新令牌、RBAC、菜单权限、按钮权限、数据范围权限。",
            "组织与人员管理：组织树、岗位、班级/部门、人员导入、账号启停、角色分配、批量重置密码。",
            "学习资源管理：课程、章节、视频、文档、图文资料、学习时长规则、资料附件、发布审核。",
            "题库与试卷管理：单选、多选、判断、填空、简答；题目标签、难度、知识点；随机组卷、固定试卷、导入导出。",
            "考试与测评管理：考试计划、报名范围、考试时间、限时、及格线、补考、阅卷、成绩发布。",
            "学员学习中心：我的课程、学习进度、待考试、考试入口、成绩、证书、学习档案。",
            "统计分析看板：学习完成率、考试通过率、组织排名、课程热度、题目正确率、异常考试趋势。",
            "通知与待办：任务发布通知、考试提醒、补考提醒、后台待办、站内信。",
            "文件与存储：MinIO 文件上传、预览、下载授权、资源版本、附件关联。",
            "系统运维：审计日志、接口日志、任务调度、缓存管理、字典配置、备份恢复。"
        ],
    ),
    (
        "5. 页面清单",
        [
            "前台学习端：登录页、首页仪表盘、我的课程、课程详情、章节学习页、章节测验页、考试列表、考试答题页、考试结果页、我的证书、个人学习档案、消息中心。",
            "后台管理端：后台首页、组织管理、人员管理、角色权限、菜单权限、课程管理、章节编辑、资源管理、题库管理、试题编辑、试卷管理、考试计划、阅卷管理、成绩管理、证书模板、统计看板、通知管理、文件管理、审计日志、系统配置。",
            "响应式策略：后台以桌面 1440px 为主，兼容 1024px；学习端支持 375px 手机、768px 平板、桌面宽屏。表单触控区域不小于 44px，移动端避免横向滚动。"
        ],
    ),
    (
        "6. 数据库表设计",
        [
            "核心表包括：sys_tenant、sys_org、sys_user、sys_role、sys_permission、sys_user_role、course、course_chapter、learning_resource、learning_task、learning_progress、question_bank、question、paper、paper_question、exam_plan、exam_user、exam_attempt、exam_answer、exam_score、certificate、notification、file_object、audit_log。",
            "设计原则：所有业务主表包含 id、tenant_id、created_at、updated_at、created_by、updated_by、deleted_at；关键业务表增加 status、version、remark；考试与成绩表保留不可变快照，避免题目修改影响历史成绩。",
            "索引建议：tenant_id + status、org_id、user_id、course_id、exam_plan_id、created_at、published_at 建组合索引；题目检索按 bank_id、type、difficulty、knowledge_point 建索引；审计日志按 actor_id、action、created_at 建索引。"
        ],
    ),
    (
        "7. API 接口规划",
        [
            "认证权限：POST /auth/login、POST /auth/refresh、GET /auth/profile、GET /auth/menus、POST /auth/logout。",
            "组织人员：GET/POST/PATCH/DELETE /orgs、GET/POST/PATCH /users、POST /users/import、POST /users/{id}/reset-password。",
            "课程资源：GET/POST/PATCH/DELETE /courses、GET/POST/PATCH /courses/{id}/chapters、POST /files/presign、POST /resources。",
            "题库试卷：GET/POST/PATCH /question-banks、GET/POST/PATCH /questions、POST /questions/import、GET/POST/PATCH /papers、POST /papers/random-compose。",
            "考试测评：GET/POST/PATCH /exam-plans、POST /exam-plans/{id}/publish、GET /exam-plans/{id}/entry、POST /exam-attempts、POST /exam-attempts/{id}/answers、POST /exam-attempts/{id}/submit、GET /exam-scores。",
            "统计报表：GET /dashboard/overview、GET /reports/learning-progress、GET /reports/exam-pass-rate、GET /reports/org-ranking、GET /reports/question-analysis。",
            "系统审计：GET /audit-logs、GET /notifications、POST /notifications、PATCH /system/settings。"
        ],
    ),
    (
        "8. 前端开发计划",
        [
            "设计方向：采用 Swiss 管理系统风格，白色/中性灰背景、1px 网格分隔、左对齐信息结构、红色用于关键风险和必做状态，避免装饰性渐变和无意义卡片堆叠。",
            "信息架构：学习端以任务驱动，首页展示待学、待考、已完成、证书；后台以业务域侧边导航和顶栏租户/组织切换为主。",
            "组件体系：统一表格、筛选栏、状态标签、步骤条、题目编辑器、考试答题面板、文件上传、权限树、组织树、统计图表、空状态、错误状态、加载骨架。",
            "交互要求：表单必须有可见标签和就近错误提示；考试答题支持自动保存、剩余时间、未答提醒、提交确认；后台列表支持筛选、分页、批量操作和导出。",
            "质量要求：路由懒加载、权限路由守卫、Pinia 状态分层、API 类型定义、移动端学习页无横向滚动、关键按钮 loading/disabled 状态完整。"
        ],
    ),
    (
        "9. 后端开发计划",
        [
            "后端采用 NestJS 模块化架构：AuthModule、UserModule、OrgModule、CourseModule、QuestionModule、PaperModule、ExamModule、ReportModule、FileModule、NotificationModule、AuditModule。",
            "数据访问采用 Prisma 或 TypeORM，推荐 Prisma 便于类型安全、迁移管理和前后端共享 DTO 思维；复杂报表使用 SQL 视图或专门查询服务。",
            "缓存与任务：Redis 用于验证码、会话黑名单、考试答题临时状态、热点统计缓存；定时任务用于考试开始/结束、逾期提交、通知提醒、数据汇总。",
            "文件服务：MinIO 存储课程附件、视频、导入模板、证书文件；后端提供授权上传、授权下载和文件元数据管理。",
            "安全策略：密码哈希、JWT 过期刷新、接口权限守卫、数据范围过滤、审计日志拦截器、导出限流、考试提交幂等、答案快照和成绩发布锁定。"
        ],
    ),
    (
        "10. 测试计划",
        [
            "单元测试：认证、权限、随机组卷、评分、学习进度计算、报表聚合、文件授权、数据范围过滤。",
            "接口测试：覆盖登录、课程发布、题目导入、考试创建、答题保存、交卷、评分、成绩发布、报表查询。",
            "前端测试：登录、权限菜单、课程学习、考试答题、后台表单校验、批量导入、统计看板渲染。",
            "性能测试：500 并发考试答题保存、1000 人考试开始、报表查询缓存命中、文件上传下载、数据库慢查询。",
            "安全测试：越权访问、水平越权、考试时间绕过、重复提交、文件未授权下载、XSS、SQL 注入、弱密码策略。",
            "验收测试：以业务流程脚本和测试用例表为准，按角色逐项验证功能、数据、权限、报表和审计。"
        ],
    ),
    (
        "11. 部署计划",
        [
            "环境划分：dev、test、staging、prod 四套环境；生产建议独立数据库、Redis、MinIO 存储卷和日志目录。",
            "容器部署：Nginx 静态前端与反向代理、NestJS API、PostgreSQL、Redis、MinIO 通过 Docker Compose 或 Kubernetes 部署。",
            "发布流程：代码合并后自动构建镜像，测试环境自动部署，预发环境人工确认，生产环境灰度发布并保留上一版本回滚镜像。",
            "运维要求：健康检查、接口日志、错误日志、数据库备份、MinIO 数据备份、Redis 持久化、Nginx 访问日志、告警通知。",
            "域名与证书：Nginx 统一 HTTPS，API 路径 /api，静态资源走缓存策略，MinIO 私有桶不直接暴露公网。"
        ],
    ),
    (
        "12. 验收标准",
        [
            "功能验收：15 个核心模块均按页面清单和 API 规划完成，关键流程可从创建课程、发布任务、组织考试、学员答题到成绩归档完整闭环。",
            "数据验收：学习进度、考试成绩、组织排名、题目正确率、证书记录与操作审计均可查询、导出、追溯。",
            "权限验收：不同角色只能访问授权菜单、按钮和数据范围；普通学员不能访问后台管理接口。",
            "性能验收：常规页面 95% 请求响应小于 500ms；报表缓存命中响应小于 1s；考试答题保存接口在 500 并发下错误率低于 1%。",
            "安全验收：通过越权、注入、XSS、文件访问、重复提交、考试时间限制等安全测试。",
            "文档验收：需求规格、概要设计、详细设计、测试用例、部署说明和验收报告齐备，版本号和日期一致。"
        ],
    ),
    (
        "13. 开发里程碑",
        [
            "M1 立项与原型确认：第 1 周，完成需求冻结、信息架构、原型、接口草案和数据模型草案。",
            "M2 基础框架与权限：第 2-3 周，完成前后端脚手架、登录、组织人员、角色权限、文件上传基础能力。",
            "M3 课程题库与学习：第 4-6 周，完成课程资源、章节学习、学习任务、题库、试题导入、学习进度。",
            "M4 考试评分与证书：第 7-9 周，完成组卷、考试计划、答题、交卷、自动评分、人工阅卷、成绩发布、证书。",
            "M5 报表通知与运维：第 10-11 周，完成统计看板、通知提醒、审计日志、导出、系统配置。",
            "M6 联调测试与验收：第 12 周，完成缺陷修复、性能优化、部署演练、验收材料和上线准备。"
        ],
    ),
    (
        "14. 人员分工建议",
        [
            "项目经理 1 人：范围、计划、风险、验收、跨部门协调。",
            "产品经理 1 人：需求规格、原型、业务流程、验收用例。",
            "UI/UX 设计 1 人：学习端、后台管理端、组件规范、响应式检查。",
            "前端工程师 2 人：学习端、后台端、组件库、权限路由、图表。",
            "后端工程师 2 人：认证权限、课程题库、考试评分、报表、文件服务。",
            "测试工程师 1 人：测试计划、测试用例、自动化接口测试、验收测试。",
            "DevOps 兼任 1 人：容器化、环境配置、CI/CD、日志备份和上线保障。"
        ],
    ),
    (
        "15. 风险与应对措施",
        [
            "需求边界扩张：建立需求变更单和版本范围，MVP 优先保证学习、考试、成绩、统计闭环。",
            "考试并发压力：答题保存接口拆分、Redis 临时存储、批量落库、幂等提交、压测提前介入。",
            "题库导入质量不稳定：提供标准模板、导入预校验、错误行提示、重复题检测和人工复核流程。",
            "权限与数据范围复杂：从第一阶段建立 RBAC + 数据范围模型，所有查询服务统一挂载租户和组织过滤。",
            "视频和文件访问风险：MinIO 私有桶、短期签名 URL、下载审计和文件类型校验。",
            "验收材料滞后：开发过程中同步维护需求矩阵、接口清单、测试用例和缺陷闭环，不在上线前临时补文档。"
        ],
    ),
]


tables = {
    "数据库核心表": [
        ["表名", "用途", "关键字段"],
        ["sys_tenant", "租户/单位", "id, name, code, status"],
        ["sys_org", "组织架构", "id, tenant_id, parent_id, name, sort"],
        ["sys_user", "用户账号", "id, tenant_id, org_id, username, password_hash, status"],
        ["sys_role", "角色", "id, tenant_id, name, code, data_scope"],
        ["course", "课程", "id, tenant_id, title, category_id, status, published_at"],
        ["course_chapter", "章节", "id, course_id, title, sort, required_minutes"],
        ["learning_progress", "学习进度", "id, user_id, course_id, chapter_id, progress, learned_seconds"],
        ["question", "试题", "id, bank_id, type, difficulty, stem, answer_snapshot"],
        ["paper", "试卷", "id, tenant_id, name, total_score, pass_score, compose_rule"],
        ["exam_plan", "考试计划", "id, paper_id, start_at, end_at, duration_minutes, status"],
        ["exam_attempt", "考试记录", "id, exam_plan_id, user_id, started_at, submitted_at, status"],
        ["exam_score", "成绩", "id, attempt_id, objective_score, subjective_score, total_score, passed"],
        ["file_object", "文件对象", "id, bucket, object_key, file_name, size, mime_type"],
        ["audit_log", "审计日志", "id, actor_id, action, resource_type, resource_id, ip, created_at"],
    ],
    "API 模块规划": [
        ["模块", "接口范围", "验收重点"],
        ["认证权限", "/auth, /roles, /permissions", "登录、刷新、退出、菜单权限、按钮权限"],
        ["组织人员", "/orgs, /users", "组织树、用户导入、角色分配、数据范围"],
        ["课程资源", "/courses, /chapters, /resources", "发布、学习、附件、章节进度"],
        ["题库试卷", "/question-banks, /questions, /papers", "导入、组卷、题型、分值"],
        ["考试测评", "/exam-plans, /exam-attempts, /exam-scores", "考试入口、保存、交卷、评分、发布"],
        ["统计报表", "/dashboard, /reports", "完成率、通过率、排名、题目分析"],
        ["系统运维", "/audit-logs, /settings, /files", "审计、配置、文件授权"],
    ],
}


def set_cell_shading(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:fill"), fill)
    tc_pr.append(shd)


def set_cell_text(cell, text, bold=False, color=None):
    cell.text = ""
    p = cell.paragraphs[0]
    run = p.add_run(text)
    run.bold = bold
    run.font.size = Pt(9)
    if color:
        run.font.color.rgb = RGBColor.from_string(color)
    cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER


def add_table(doc, title, rows):
    p = doc.add_paragraph()
    p.style = "Heading 2"
    p.add_run(title)
    table = doc.add_table(rows=len(rows), cols=len(rows[0]))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.style = "Table Grid"
    for r_idx, row in enumerate(rows):
        for c_idx, value in enumerate(row):
            cell = table.cell(r_idx, c_idx)
            set_cell_text(cell, value, bold=(r_idx == 0), color="FFFFFF" if r_idx == 0 else None)
            if r_idx == 0:
                set_cell_shading(cell, "2E74B5")
            elif r_idx % 2 == 0:
                set_cell_shading(cell, "F2F4F7")
    doc.add_paragraph()


def build_markdown():
    lines = [f"# {PROJECT_NAME}项目蓝图", "", "版本：V1.0", "日期：2026-06-02", ""]
    for title, paras in sections:
        lines.append(f"## {title}")
        for para in paras:
            lines.append(f"- {para}")
        lines.append("")
    for title, rows in tables.items():
        lines.append(f"## {title}")
        lines.append("| " + " | ".join(rows[0]) + " |")
        lines.append("| " + " | ".join(["---"] * len(rows[0])) + " |")
        for row in rows[1:]:
            lines.append("| " + " | ".join(row) + " |")
        lines.append("")
    md_path = OUT_DIR / "思政理论学习考核评价系统-项目蓝图.md"
    md_path.write_text("\n".join(lines), encoding="utf-8")
    return md_path


def build_docx():
    doc = Document()
    section = doc.sections[0]
    section.top_margin = Inches(1)
    section.bottom_margin = Inches(1)
    section.left_margin = Inches(1)
    section.right_margin = Inches(1)

    styles = doc.styles
    styles["Normal"].font.name = "Calibri"
    styles["Normal"].font.size = Pt(11)
    styles["Heading 1"].font.color.rgb = RGBColor(46, 116, 181)
    styles["Heading 1"].font.size = Pt(16)
    styles["Heading 2"].font.color.rgb = RGBColor(46, 116, 181)
    styles["Heading 2"].font.size = Pt(13)

    title = doc.add_paragraph()
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = title.add_run(f"{PROJECT_NAME}\n项目蓝图与验收方案")
    run.bold = True
    run.font.size = Pt(22)
    run.font.color.rgb = RGBColor(11, 37, 69)

    subtitle = doc.add_paragraph()
    subtitle.alignment = WD_ALIGN_PARAGRAPH.CENTER
    sub_run = subtitle.add_run("需求规格 + 概要设计 + 详细设计 + 测试验收 + 项目管理")
    sub_run.font.size = Pt(11)
    sub_run.font.color.rgb = RGBColor(85, 85, 85)

    meta = doc.add_table(rows=4, cols=2)
    meta.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta.style = "Table Grid"
    meta_data = [
        ["版本", "V1.0"],
        ["日期", "2026-06-02"],
        ["推荐技术栈", "Vue 3 + TypeScript, NestJS, PostgreSQL, Redis, MinIO, Docker + Nginx"],
        ["适用范围", "立项评审、研发排期、接口设计、测试执行、上线验收"],
    ]
    for i, row in enumerate(meta_data):
        for j, value in enumerate(row):
            set_cell_text(meta.cell(i, j), value, bold=(j == 0))
            if j == 0:
                set_cell_shading(meta.cell(i, j), "E8EEF5")

    doc.add_page_break()

    for title_text, paras in sections:
        doc.add_heading(title_text, level=1)
        for para in paras:
            p = doc.add_paragraph(para)
            p.paragraph_format.space_after = Pt(6)

    for title_text, rows in tables.items():
        add_table(doc, title_text, rows)

    doc.add_heading("交付物与验收闭环", level=1)
    for item in [
        "需求文档、设计文档、排期表、任务分工表、测试用例表、验收报告在项目全周期同步维护。",
        "每个里程碑必须具备可演示功能、测试记录、缺陷闭环和负责人签字确认。",
        "上线前完成生产部署演练、数据备份验证、权限抽检、安全测试和性能压测。",
    ]:
        doc.add_paragraph(item, style=None)

    out_path = OUT_DIR / "思政理论学习考核评价系统-项目蓝图与验收方案.docx"
    doc.save(out_path)
    return out_path


SVG_STYLE = """
<style>
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&amp;display=swap');
text { font-family: 'JetBrains Mono', 'Noto Sans SC', 'PingFang SC', sans-serif; }
.title { fill:#f8fafc; font-size:18px; font-weight:700; }
.sub { fill:#94a3b8; font-size:9px; }
.label { fill:#f8fafc; font-size:12px; font-weight:600; }
.small { fill:#cbd5e1; font-size:9px; }
.tiny { fill:#94a3b8; font-size:8px; }
.region { fill:none; stroke:#fbbf24; stroke-width:1; stroke-dasharray:8 4; }
.line { fill:none; stroke:#64748b; stroke-width:1.4; marker-end:url(#arrow); }
.lineCyan { fill:none; stroke:#22d3ee; stroke-width:1.6; marker-end:url(#arrow-cyan); }
.lineGreen { fill:none; stroke:#34d399; stroke-width:1.6; marker-end:url(#arrow-green); }
.lineRose { fill:none; stroke:#fb7185; stroke-width:1.4; stroke-dasharray:6 4; marker-end:url(#arrow-rose); }
</style>
"""


def svg_defs():
    return """
<defs>
  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" stroke-width="0.5"/>
  </pattern>
  <marker id="arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
    <polygon points="0 0, 10 3.5, 0 7" fill="#64748b"/>
  </marker>
  <marker id="arrow-cyan" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
    <polygon points="0 0, 10 3.5, 0 7" fill="#22d3ee"/>
  </marker>
  <marker id="arrow-green" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
    <polygon points="0 0, 10 3.5, 0 7" fill="#34d399"/>
  </marker>
  <marker id="arrow-rose" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
    <polygon points="0 0, 10 3.5, 0 7" fill="#fb7185"/>
  </marker>
</defs>
"""


def box(x, y, w, h, title, sub, fill, stroke):
    return f"""
<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="6" fill="#0f172a"/>
<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="6" fill="{fill}" stroke="{stroke}" stroke-width="1.5"/>
<text x="{x + w/2}" y="{y + 25}" class="label" text-anchor="middle">{title}</text>
<text x="{x + w/2}" y="{y + 43}" class="small" text-anchor="middle">{sub}</text>
"""


def cylinder(x, y, title, sub):
    return f"""
<g transform="translate({x},{y})">
  <rect x="0" y="12" width="150" height="58" rx="2" fill="#0f172a"/>
  <ellipse cx="75" cy="12" rx="75" ry="13" fill="#0f172a"/>
  <ellipse cx="75" cy="70" rx="75" ry="13" fill="#0f172a"/>
  <rect x="0" y="12" width="150" height="58" fill="rgba(76,29,149,0.4)"/>
  <ellipse cx="75" cy="12" rx="75" ry="13" fill="rgba(76,29,149,0.4)" stroke="#a78bfa" stroke-width="1.5"/>
  <ellipse cx="75" cy="70" rx="75" ry="13" fill="rgba(76,29,149,0.4)" stroke="#a78bfa" stroke-width="1.5"/>
  <line x1="0" y1="12" x2="0" y2="70" stroke="#a78bfa" stroke-width="1.5"/>
  <line x1="150" y1="12" x2="150" y2="70" stroke="#a78bfa" stroke-width="1.5"/>
  <text x="75" y="42" class="label" text-anchor="middle">{title}</text>
  <text x="75" y="57" class="small" text-anchor="middle">{sub}</text>
</g>
"""


def build_architecture_svg():
    svg = f"""<svg viewBox="0 0 1180 720" xmlns="http://www.w3.org/2000/svg">
{SVG_STYLE}{svg_defs()}
<rect width="1180" height="720" fill="#0f172a"/>
<rect width="1180" height="720" fill="url(#grid)"/>
<text x="32" y="38" class="title">系统架构图 - 思政理论学习考核评价系统</text>
<text x="32" y="56" class="sub">Vue 3 + NestJS + PostgreSQL + Redis + MinIO + Docker + Nginx</text>
<rect x="28" y="78" width="1124" height="574" rx="12" class="region"/>
<text x="42" y="97" fill="#fbbf24" font-size="10" font-weight="600">Docker / Nginx / Private Network</text>

{box(60, 135, 160, 64, "学习端", "Web/H5/移动适配", "rgba(8,51,68,0.4)", "#22d3ee")}
{box(60, 245, 160, 64, "管理后台", "组织/课程/考试/报表", "rgba(8,51,68,0.4)", "#22d3ee")}
{box(60, 355, 160, 64, "外部身份", "SSO/LDAP 可扩展", "rgba(30,41,59,0.5)", "#94a3b8")}

{box(305, 190, 170, 70, "Nginx 网关", "HTTPS / 静态资源 / 反代", "rgba(120,53,15,0.3)", "#fbbf24")}
{box(305, 310, 170, 70, "API Gateway", "鉴权 / 限流 / 路由", "rgba(120,53,15,0.3)", "#fbbf24")}

{box(560, 105, 155, 60, "Auth 模块", "登录 / RBAC / 菜单", "rgba(6,78,59,0.4)", "#34d399")}
{box(760, 105, 155, 60, "UserOrg 模块", "组织 / 人员 / 数据范围", "rgba(6,78,59,0.4)", "#34d399")}
{box(560, 205, 155, 60, "Course 模块", "课程 / 章节 / 进度", "rgba(6,78,59,0.4)", "#34d399")}
{box(760, 205, 155, 60, "Question 模块", "题库 / 试卷 / 组卷", "rgba(6,78,59,0.4)", "#34d399")}
{box(560, 305, 155, 60, "Exam 模块", "答题 / 评分 / 成绩", "rgba(6,78,59,0.4)", "#34d399")}
{box(760, 305, 155, 60, "Report 模块", "看板 / 报表 / 导出", "rgba(6,78,59,0.4)", "#34d399")}
{box(560, 405, 155, 60, "File 模块", "上传 / 预览 / 授权", "rgba(6,78,59,0.4)", "#34d399")}
{box(760, 405, 155, 60, "Audit 模块", "日志 / 留痕 / 追溯", "rgba(136,19,55,0.4)", "#fb7185")}

<rect x="532" y="505" width="440" height="34" rx="8" fill="rgba(251,146,60,0.3)" stroke="#fb923c"/>
<text x="752" y="527" class="label" text-anchor="middle">Redis 缓存与队列：验证码 / 考试临时答案 / 报表缓存 / 定时任务</text>

{cylinder(1010, 140, "PostgreSQL", "业务数据 / 历史快照")}
{cylinder(1010, 300, "MinIO", "课件 / 视频 / 证书")}
{cylinder(1010, 460, "Redis", "缓存 / 会话 / 队列")}

<path d="M220 167 L305 225" class="lineCyan"/>
<path d="M220 277 L305 225" class="lineCyan"/>
<path d="M220 387 L305 345" class="line"/>
<path d="M475 225 L560 135" class="line"/>
<path d="M475 345 L560 235" class="lineGreen"/>
<path d="M475 345 L560 335" class="lineGreen"/>
<path d="M915 135 L1010 180" class="line"/>
<path d="M915 235 L1010 180" class="line"/>
<path d="M915 335 L1010 180" class="line"/>
<path d="M915 435 L1010 345" class="line"/>
<path d="M752 505 L1085 530" class="line"/>

<rect x="835" y="600" width="300" height="32" rx="6" fill="rgba(30,41,59,0.7)" stroke="#94a3b8"/>
<text x="985" y="621" class="tiny" text-anchor="middle">安全边界：JWT + RBAC + 数据范围 + 审计日志 + 私有文件桶</text>
</svg>"""
    path = DIAGRAM_DIR / "system-architecture.svg"
    path.write_text(svg, encoding="utf-8")
    return path


def build_business_flow_svg():
    svg = f"""<svg viewBox="0 0 980 880" xmlns="http://www.w3.org/2000/svg">
{SVG_STYLE}{svg_defs()}
<rect width="980" height="880" fill="#0f172a"/><rect width="980" height="880" fill="url(#grid)"/>
<text x="30" y="38" class="title">业务流程图 - 从课程建设到验收归档</text>
<text x="30" y="56" class="sub">主线：资源建设 -> 任务发布 -> 学习考试 -> 评分证书 -> 报表归档</text>

{box(390, 85, 200, 52, "开始：制定学习计划", "组织管理员配置范围", "rgba(59,130,246,0.3)", "#60a5fa")}
{box(390, 175, 200, 56, "创建课程与章节", "课程管理员上传资源", "rgba(8,51,68,0.4)", "#22d3ee")}
{box(390, 270, 200, 56, "维护题库与试卷", "题库管理员导入试题", "rgba(6,78,59,0.4)", "#34d399")}
<g transform="translate(490,385)">
  <polygon points="0,-42 70,0 0,42 -70,0" fill="#0f172a"/>
  <polygon points="0,-42 70,0 0,42 -70,0" fill="rgba(120,53,15,0.3)" stroke="#fbbf24" stroke-width="1.5"/>
  <text y="-5" class="label" text-anchor="middle">是否审核通过</text>
  <text y="13" class="small" text-anchor="middle">内容/题库</text>
</g>
{box(690, 355, 180, 56, "退回修改", "记录审核意见", "rgba(136,19,55,0.4)", "#fb7185")}
{box(390, 485, 200, 56, "发布学习与考试任务", "范围/时间/规则", "rgba(8,51,68,0.4)", "#22d3ee")}
{box(390, 585, 200, 56, "学员学习并参加考试", "进度/答题自动保存", "rgba(6,78,59,0.4)", "#34d399")}
{box(390, 685, 200, 56, "评分、发布成绩、生成证书", "客观题自动评分", "rgba(6,78,59,0.4)", "#34d399")}
{box(390, 785, 200, 52, "结束：报表归档验收", "导出与审计留痕", "rgba(59,130,246,0.3)", "#60a5fa")}

<path d="M490 137 L490 175" class="lineCyan"/>
<path d="M490 231 L490 270" class="lineCyan"/>
<path d="M490 326 L490 343" class="lineCyan"/>
<path d="M560 385 L690 385" class="lineRose"/><text x="610" y="376" fill="#fb7185" font-size="9">否</text>
<path d="M780 355 L780 205 L590 205" class="lineRose"/>
<path d="M490 427 L490 485" class="lineGreen"/><text x="505" y="462" fill="#34d399" font-size="9">是</text>
<path d="M490 541 L490 585" class="lineGreen"/>
<path d="M490 641 L490 685" class="lineGreen"/>
<path d="M490 741 L490 785" class="lineGreen"/>

<rect x="50" y="585" width="230" height="165" rx="10" fill="rgba(30,41,59,0.5)" stroke="#94a3b8"/>
<text x="165" y="612" class="label" text-anchor="middle">异常处理</text>
<text x="70" y="638" class="small">1. 未学完：提醒与督学</text>
<text x="70" y="662" class="small">2. 未通过：进入补考</text>
<text x="70" y="686" class="small">3. 答题异常：审计记录</text>
<text x="70" y="710" class="small">4. 主观题：人工阅卷</text>
<path d="M390 610 L280 650" class="line"/>
<path d="M280 710 L390 710" class="line"/>
</svg>"""
    path = DIAGRAM_DIR / "business-flow.svg"
    path.write_text(svg, encoding="utf-8")
    return path


def build_data_flow_svg():
    svg = f"""<svg viewBox="0 0 1060 760" xmlns="http://www.w3.org/2000/svg">
{SVG_STYLE}{svg_defs()}
<rect width="1060" height="760" fill="#0f172a"/><rect width="1060" height="760" fill="url(#grid)"/>
<text x="30" y="38" class="title">数据流图 - 学习、考试、成绩与审计数据闭环</text>
<text x="30" y="56" class="sub">每次考试保留题目快照、答案快照、成绩快照和审计日志</text>

{box(55, 135, 150, 60, "管理员", "配置课程/考试", "rgba(30,41,59,0.5)", "#94a3b8")}
{box(55, 445, 150, 60, "学员", "学习/答题/查询", "rgba(30,41,59,0.5)", "#94a3b8")}

{box(300, 95, 170, 60, "课程资源服务", "课程/章节/附件", "rgba(8,51,68,0.4)", "#22d3ee")}
{box(300, 215, 170, 60, "题库试卷服务", "题目/试卷/规则", "rgba(6,78,59,0.4)", "#34d399")}
{box(300, 365, 170, 60, "学习进度服务", "进度/时长/完成率", "rgba(8,51,68,0.4)", "#22d3ee")}
{box(300, 515, 170, 60, "考试答题服务", "尝试/答案/提交", "rgba(6,78,59,0.4)", "#34d399")}

{cylinder(610, 100, "业务数据库", "课程/题库/考试/成绩")}
{cylinder(610, 270, "Redis", "临时答案/缓存/队列")}
{cylinder(610, 440, "MinIO", "课件/视频/证书文件")}

{box(835, 140, 170, 60, "报表服务", "聚合/排名/导出", "rgba(6,78,59,0.4)", "#34d399")}
{box(835, 310, 170, 60, "证书服务", "模板/生成/下载", "rgba(8,51,68,0.4)", "#22d3ee")}
{box(835, 480, 170, 60, "审计服务", "登录/操作/异常", "rgba(136,19,55,0.4)", "#fb7185")}

<path d="M205 165 L300 125" class="lineCyan"/><text x="230" y="132" class="tiny">发布资源</text>
<path d="M205 165 L300 245" class="lineGreen"/><text x="230" y="235" class="tiny">维护题库</text>
<path d="M205 475 L300 395" class="lineCyan"/><text x="230" y="415" class="tiny">学习事件</text>
<path d="M205 475 L300 545" class="lineGreen"/><text x="230" y="535" class="tiny">答题事件</text>

<path d="M470 125 L610 140" class="line"/>
<path d="M470 245 L610 140" class="line"/>
<path d="M470 395 L610 140" class="line"/>
<path d="M470 545 L610 310" class="lineGreen"/>
<path d="M470 545 L610 140" class="line"/>
<path d="M470 125 L610 480" class="lineCyan"/>

<path d="M760 140 L835 170" class="lineGreen"/>
<path d="M760 140 L835 340" class="lineCyan"/>
<path d="M760 310 L835 510" class="lineRose"/>
<path d="M760 480 L835 340" class="lineCyan"/>

<rect x="300" y="650" width="705" height="44" rx="8" fill="rgba(251,146,60,0.3)" stroke="#fb923c"/>
<text x="652" y="676" class="label" text-anchor="middle">验收数据链：学习进度 -> 考试记录 -> 答案快照 -> 成绩发布 -> 证书归档 -> 审计追溯</text>
</svg>"""
    path = DIAGRAM_DIR / "data-flow.svg"
    path.write_text(svg, encoding="utf-8")
    return path


if __name__ == "__main__":
    print(build_markdown())
    print(build_docx())
    print(build_architecture_svg())
    print(build_business_flow_svg())
    print(build_data_flow_svg())
