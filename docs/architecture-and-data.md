# 架构与数据设计

## 1. 技术架构

- 前端：Vue 3、TypeScript、Vite、Pinia、Vue Router、Element Plus。
- 后端：NestJS、TypeScript、Swagger。
- 数据层：PostgreSQL 为主库，Redis 用于缓存与临时状态，MinIO 用于文件对象存储。
- 交付形态：Docker Compose 本地部署，Nginx 统一入口。

## 2. 模块分层

| 层次 | 模块 | 说明 |
| --- | --- | --- |
| 展示层 | `apps/web` | 学员与管理后台界面 |
| 接口层 | `apps/api` | 鉴权、课程、题库、考试、报表接口 |
| 共享层 | `packages/shared` | DTO、类型与前后端共享模型 |
| 数据层 | Prisma schema | 领域模型草案与数据库迁移基础 |
| 交付层 | `deliverables/` | 图表、蓝图、验收材料 |

## 3. 当前数据模型覆盖

`apps/api/prisma/schema.prisma` 已定义以下核心实体：

- `Tenant`
- `Org`
- `User`
- `Course`
- `CourseChapter`
- `Question`
- `ExamPlan`
- `ExamAttempt`

## 4. 建议补充的数据实体

为支撑完整业务闭环，后续应继续补齐：

- `Role`
- `Permission`
- `UserRole`
- `LearningProgress`
- `Paper`
- `PaperQuestion`
- `ExamScore`
- `Certificate`
- `Notification`
- `FileObject`
- `AuditLog`

## 5. 权限矩阵

| 模块 | 平台管理员 | 组织管理员 | 课程管理员 | 题库管理员 | 学员 | 审计人员 |
| --- | --- | --- | --- | --- | --- | --- |
| 组织与人员 | 全量 | 本组织 | 只读 | 无 | 无 | 只读 |
| 课程管理 | 全量 | 本组织发布 | 全量 | 只读 | 只读已发布 | 只读 |
| 题库管理 | 全量 | 审核 | 只读 | 全量 | 无 | 只读 |
| 考试计划 | 全量 | 本组织全量 | 只读 | 只读 | 仅本人入口 | 只读 |
| 成绩与报表 | 全量 | 本组织 | 只读汇总 | 题目分析只读 | 仅本人 | 只读 |
| 审计日志 | 全量 | 本组织 | 无 | 无 | 无 | 全量只读 |
| 系统配置 | 全量 | 部分 | 无 | 无 | 无 | 无 |

## 6. 报表指标

| 指标 | 口径 |
| --- | --- |
| 学习完成率 | 完成课程人数 / 指定范围学习人数 |
| 考试通过率 | 通过人数 / 已提交人数 |
| 组织排名 | 按平均分、完成率、通过率综合排序 |
| 题目正确率 | 题目答对次数 / 题目作答次数 |
| 风险预警数 | 逾期未学、缺考、低分、异常提交总数 |

## 7. 风险点

- 目前 API 服务主要使用内存种子数据，尚未真正接入 Prisma 与数据库读写。
- 权限控制仍停留在登录态校验，未实现角色菜单、按钮和数据范围约束。
- 审计日志为示例数据，未形成跨模块统一留痕机制。
