# API 接口规划

## API 规范

- 基础路径：`/api/v1`。
- 鉴权方式：JWT Access Token + Refresh Token，管理端写操作需 RBAC 权限码。
- 响应格式：`{ code, message, data, traceId }`。
- 分页格式：`GET /resources?page=1&pageSize=20&keyword=` 返回 `{ items, page, pageSize, total }`。
- 所有 DTO 在后端校验，关键枚举同步到 `packages/shared`。

## 接口清单

| 模块 | 方法与路径 | 说明 |
|---|---|---|
| 鉴权 | `POST /auth/login` | 登录 |
| 鉴权 | `POST /auth/refresh` | 刷新令牌 |
| 鉴权 | `GET /auth/me` | 当前用户、角色、权限 |
| 组织 | `GET /org-units` | 组织树 |
| 组织 | `POST /users/import` | 用户批量导入 |
| 课程 | `GET /courses` / `POST /courses` | 课程列表与创建 |
| 课程 | `PUT /courses/{id}` | 更新课程 |
| 章节 | `POST /courses/{id}/chapters` | 新建章节 |
| 章节 | `PUT /chapters/{id}/sort` | 章节排序 |
| 学习任务 | `POST /learning-tasks` | 创建并发布任务 |
| 学习任务 | `GET /learning-tasks` | 查询任务列表 |
| 学习任务 | `GET /learning-tasks/{id}/progress` | 任务完成统计 |
| 学习记录 | `POST /learning-records/heartbeat` | 学习心跳与进度保存 |
| 学习记录 | `POST /learning-records/complete` | 完成章节 |
| 题库 | `GET /question-banks` / `POST /question-banks` | 题库管理 |
| 题目 | `POST /questions` | 创建题目 |
| 题目 | `POST /questions/import` | 批量导入题目 |
| 题目 | `POST /questions/{id}/review` | 审核题目 |
| 组卷 | `POST /papers` | 创建固定试卷 |
| 组卷 | `POST /papers/generate` | 按策略生成试卷 |
| 考试 | `POST /exams` | 发布考试 |
| 考试 | `POST /exams/{id}/start` | 开始考试，生成答题记录 |
| 考试 | `PUT /exam-attempts/{id}/answers` | 保存答案 |
| 考试 | `POST /exam-attempts/{id}/submit` | 交卷并触发阅卷 |
| 自动阅卷 | `POST /exam-attempts/{id}/auto-mark` | 客观题自动判分 |
| 人工阅卷 | `GET /marking-tasks` | 待阅卷列表 |
| 人工阅卷 | `PUT /marking-tasks/{id}` | 提交评分与评语 |
| 成绩 | `GET /exams/{id}/scores` | 成绩列表 |
| 积分 | `GET /credits/my` | 我的积分明细 |
| 积分 | `POST /credits/rules` | 积分规则配置 |
| 统计 | `GET /reports/personal` | 个人统计 |
| 统计 | `GET /reports/classes` | 班级统计 |
| 统计 | `GET /reports/departments` | 院系统计 |
| 证书 | `POST /certificates/generate` | 生成证书 |
| 报告 | `POST /learning-reports/generate` | 生成学习报告 |
| 文件 | `POST /files/upload` | 上传附件到 MinIO |
| 文件 | `GET /files/{id}/download-url` | 获取短时下载地址 |
| 通知 | `GET /notifications` | 通知列表 |
| 审计 | `GET /audit-logs` | 审计日志查询 |

## 错误码

| 错误码 | 含义 |
|---|---|
| `AUTH_INVALID` | 登录失效或令牌非法 |
| `PERMISSION_DENIED` | 权限不足 |
| `VALIDATION_ERROR` | 参数校验失败 |
| `BUSINESS_CONFLICT` | 业务状态冲突，如重复交卷 |
| `EXAM_TIME_INVALID` | 不在考试时间窗口 |
| `FILE_TYPE_DENIED` | 文件类型不允许 |
| `RESOURCE_NOT_FOUND` | 资源不存在或无权访问 |
