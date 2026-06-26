# 思政理论学习考核评价系统文档中心

本文档集用于指导《思政理论学习考核评价系统》从立项、设计、开发、测试、部署到最终验收的全过程。系统建议采用 Vue 3 + TypeScript 前端、NestJS 后端、PostgreSQL 数据库、Redis 缓存、MinIO 文件存储、Docker + Nginx 部署。

## 文档目录

| 类别 | 文件 | 主要内容 |
|---|---|---|
| 项目定位 | `requirements/project-scope.md` | 项目概述、建设目标、范围边界 |
| 用户与权限 | `requirements/roles-permissions.md` | 用户角色、权限矩阵、数据范围 |
| 功能结构 | `requirements/functional-modules.md` | 学习、题库、考试、阅卷、评价、证书 |
| 系统架构 | `architecture/system-architecture.md` | 前后端、服务、存储、集成架构 |
| 业务流程 | `architecture/business-flow.md` | 核心业务流程与闭环 |
| 数据模型 | `architecture/data-model.md` | 数据库表设计与索引建议 |
| 界面设计 | `design/frontend-pages.md` | 页面清单、后台界面、响应式交互 |
| 报表与文件 | `design/reports-alerts-files.md` | 报表指标、告警通知、附件管理 |
| API | `api/api-plan.md` | REST 接口、DTO、错误码、鉴权 |
| 测试 | `test/test-plan.md` | 测试策略、测试用例、验收闭环 |
| 部署 | `deployment/deployment-plan.md` | Docker、Nginx、环境、运维 |
| 验收 | `acceptance/acceptance-standard.md` | 验收标准、里程碑、交付物 |
| GitHub | `acceptance/github-engineering.md` | 分支、PR、CI、代码评审规范 |

## 覆盖范围

文档已覆盖项目定位、用户角色、核心业务流程、功能模块、页面清单、数据模型、接口规划、权限矩阵、报表指标、告警通知规则、文件附件管理、Git/GitHub 工程规范、测试计划、部署方案、验收标准、里程碑计划。重点业务包含学习任务、课程章节、学习记录、题库、组卷、在线考试、自动阅卷、人工阅卷、积分评价、个人/班级/院系统计、证书和学习报告。
