# 思政理论学习考核评价系统

本项目用于建设“思想理论学习考核平台”，覆盖学习任务发布、课程学习、在线考试、题库管理、自动阅卷、学习积分、考核评价、班级/院系统计、证书生成和学习报告等业务。

## 推荐技术栈

- 前端：Vue 3 + TypeScript + Vite + Pinia + Vue Router + Element Plus
- 后端：NestJS + TypeScript
- 数据库：PostgreSQL
- 缓存：Redis
- 文件存储：MinIO
- 部署：Docker + Nginx
- 协作：Git + GitHub + Issue + Pull Request + GitHub Actions + Release

## 当前交付物

- `deliverables/outputs/思想理论学习考核平台-项目蓝图与验收方案.docx`
- `deliverables/outputs/思想理论学习考核平台-项目蓝图.md`
- `deliverables/outputs/思想理论学习考核平台-项目排期任务测试验收表.xlsx`
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

## Commit Message 规范

使用 Conventional Commits：

- `feat:` 新功能
- `fix:` 修复问题
- `docs:` 文档变更
- `style:` 代码格式调整
- `refactor:` 重构
- `test:` 测试相关
- `chore:` 构建、配置、依赖、脚手架
- `ci:` CI/CD 配置
- `perf:` 性能优化
- `revert:` 回滚提交

示例：

```bash
feat: add exam attempt autosave
fix: resolve score publish permission check
docs: update deployment guide
ci: add github actions workflow
```

## 快速开始

```bash
git checkout develop
git checkout -b feature/user-auth

# 完成功能开发后
git add .
git commit -m "feat: add user authentication module"
git push -u origin feature/user-auth
```

在 GitHub 上创建 Pull Request 到 `develop`，通过 CI 检查和代码评审后合并。
