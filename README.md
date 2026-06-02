# 思政理论学习考核评价系统

本项目用于建设“思想理论学习考核平台”，覆盖学习任务发布、课程学习、在线考试、题库管理、自动阅卷、学习积分、考核评价、班级/院系统计、证书生成和学习报告等业务。

## 技术栈

- 前端：Vue 3 + TypeScript + Vite + Pinia + Vue Router + Element Plus
- 后端：NestJS + TypeScript
- 数据库：PostgreSQL，当前 MVP 提供 Prisma schema
- 缓存：Redis
- 文件存储：MinIO
- 部署：Docker + Nginx
- 协作：Git + GitHub + Issue + Pull Request + GitHub Actions + Release

## 仓库结构

```text
apps/
  api/              NestJS API
  web/              Vue 3 前端
packages/
  shared/           前后端共享类型
deliverables/       项目规划、图表、排期和验收材料
```

## 本地运行

安装依赖：

```bash
npm install
```

启动 API：

```bash
npm run dev:api
```

启动前端：

```bash
npm run dev:web
```

访问：

- 前端：http://localhost:5173
- API：http://localhost:3000/api
- Swagger：http://localhost:3000/api/docs

演示账号：

| 角色 | 账号 | 密码 |
|---|---|---|
| 管理员 | `admin` | `Admin@123` |
| 学员 | `student` | `Student@123` |

## Docker 部署

```bash
docker compose up --build
```

访问：

- Web：http://localhost
- API：http://localhost:3000/api
- MinIO 控制台：http://localhost:9001

## 当前已实现 MVP

- 登录与 JWT 认证
- 工作台概览
- 课程列表
- 题库列表
- 考试计划列表
- 在线答题与提交评分
- 统计报表页
- Prisma PostgreSQL 数据模型
- Docker Compose：Web、API、PostgreSQL、Redis、MinIO
- GitHub Actions CI

## 交付物

- `deliverables/outputs/思想理论学习考核平台-项目蓝图与验收方案.docx`
- `deliverables/outputs/思想理论学习考核平台-项目蓝图.md`
- `deliverables/outputs/思想理论学习考核平台-项目排期任务测试验收表.xlsx`
- `deliverables/outputs/Git-GitHub版本管理与协作方案.md`
- `deliverables/diagrams/system-architecture.svg`
- `deliverables/diagrams/business-flow.svg`
- `deliverables/diagrams/data-flow.svg`

## 分支模型

- `main`：稳定主分支，只接收验收通过的发布版本。
- `develop`：开发集成分支，功能分支合并入口。
- `feature/<module>`：功能开发分支。
- `fix/<issue>`：缺陷修复分支。
- `release/<version>`：验收发布分支。
- `hotfix/<issue>`：生产紧急修复分支。
