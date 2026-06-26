# 接口与测试计划

## 1. 接口规划

### 已实现或已提供原型的接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `POST` | `/auth/login` | 登录并返回 token |
| `GET` | `/dashboard/overview` | 工作台总览 |
| `GET` | `/courses` | 课程列表 |
| `POST` | `/courses` | 新增课程 |
| `GET` | `/questions` | 题库列表 |
| `POST` | `/questions` | 新增试题 |
| `GET` | `/exams` | 考试列表 |
| `GET` | `/exams/:id/entry` | 进入考试并拉取题目 |
| `POST` | `/exams/:id/submit` | 提交答卷 |
| `GET` | `/audit-logs` | 审计日志 |

### 已规划待开发接口

| 模块 | 接口范围 |
| --- | --- |
| 组织与用户 | `/orgs`、`/users`、`/roles`、`/permissions` |
| 章节学习 | `/courses/:id/chapters`、`/learning-progress` |
| 试卷管理 | `/papers`、`/papers/random-compose` |
| 成绩发布 | `/exam-scores`、`/certificates` |
| 通知消息 | `/notifications` |
| 文件服务 | `/files/presign`、`/files/:id/download` |
| 报表分析 | `/reports/learning-progress`、`/reports/org-ranking`、`/reports/question-analysis` |

## 2. 测试分层

| 层级 | 目标 | 当前状态 |
| --- | --- | --- |
| 单元测试 | 服务层规则、评分逻辑、权限校验 | 已有 1 个基础用例，覆盖不足 |
| 接口测试 | 登录、课程、题库、考试提交流程 | 未建立自动化 |
| 前端交互测试 | 登录、跳转、答题、报表渲染 | 未建立自动化 |
| 构建验证 | build、typecheck、lint | 已接入，lint 本轮已修复配置 |
| 验收测试 | 按角色走主业务闭环 | 仅有文档清单，未脚本化 |

## 3. 本轮建议测试用例补齐方向

1. 认证失败与 token 过期。
2. 学员未登录访问受限页面跳转登录。
3. 题目新增后列表可见。
4. 考试提交后得分与通过状态正确。
5. 组织管理员越权访问其他组织数据被拒绝。
6. 报表页在空数据和正常数据下都能渲染。

## 4. 验收标准

- 功能：学员可完成登录、学习入口访问、考试答题和结果查看。
- 数据：课程、试题、考试、成绩、审计日志数据链闭环一致。
- 权限：未登录用户被拦截，学员无法进入后台管理能力。
- 质量：`test`、`build`、`typecheck`、`lint` 全部通过。
- 文档：需求、设计、接口、测试、部署、验收材料可追溯。
