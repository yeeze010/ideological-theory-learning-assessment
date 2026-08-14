# Git + GitHub 版本管理与协作方案

项目：思政理论学习考核评价系统

## 1. 本地 Git 初始化步骤

```bash
git init
git branch -M main

git add .
git commit -m "chore: initialize project structure"

git checkout -b develop
```

如果需要绑定 GitHub 远程仓库：

```bash
git remote add origin https://github.com/<org>/<repo-name>.git
git push -u origin main
git push -u origin develop
```

当前项目尚未提供 GitHub 远程仓库地址，因此远程绑定需要在确认 `<org>/<repo-name>` 后执行。

## 2. 分支模型

| 分支 | 用途 | 合并目标 |
|---|---|---|
| `main` | 稳定主分支，保存验收通过版本 | 只接收 `release/*` 或 `hotfix/*` |
| `develop` | 开发集成分支 | 接收 `feature/*` 和 `fix/*` |
| `feature/<module>` | 功能开发 | 合并到 `develop` |
| `fix/<issue>` | 测试阶段缺陷修复 | 合并到 `develop` |
| `release/<version>` | 验收候选版本 | 验收后合并到 `main` 和 `develop` |
| `hotfix/<issue>` | 生产紧急修复 | 合并到 `main` 和 `develop` |

推荐分支示例：

```bash
feature/auth-rbac
feature/course-learning
feature/question-bank
feature/exam-scoring
feature/report-dashboard
fix/exam-submit-idempotency
release/v1.0.0
hotfix/file-download-permission
```

## 3. Commit Message 规范

统一使用 Conventional Commits：

| 类型 | 说明 | 示例 |
|---|---|---|
| `feat` | 新功能 | `feat: add learning task publish flow` |
| `fix` | 修复问题 | `fix: prevent duplicate exam submission` |
| `docs` | 文档变更 | `docs: update acceptance checklist` |
| `style` | 代码格式调整 | `style: format course module` |
| `refactor` | 重构 | `refactor: split exam scoring service` |
| `test` | 测试相关 | `test: add question import cases` |
| `chore` | 构建、配置、依赖 | `chore: initialize project structure` |
| `ci` | CI/CD 配置 | `ci: add github actions workflow` |
| `perf` | 性能优化 | `perf: optimize dashboard query cache` |
| `revert` | 回滚提交 | `revert: revert exam page redesign` |

## 4. Tag 版本规划

| Tag | 阶段 | 验收含义 |
|---|---|---|
| `v0.1.0` | 项目初始化与基础框架 | 前后端脚手架、数据库迁移、基础部署可运行 |
| `v0.3.0` | 核心模块初版 | 登录权限、组织人员、课程资源、题库初版完成 |
| `v0.5.0` | 主流程联调 | 学习任务、在线考试、评分、成绩主流程打通 |
| `v0.8.0` | 测试环境可演示 | 报表、通知、审计、导出完成，可组织验收预演 |
| `v1.0.0` | 正式验收版本 | 通过功能、性能、安全、文档和部署验收 |

创建验收版本示例：

```bash
git tag -a v1.0.0 -m "v1.0.0 acceptance release"
git push origin v1.0.0
```

## 5. Git 与 GitHub 协作流程

1. 从 `develop` 创建功能分支。
2. 在 `feature/<module>` 分支完成开发。
3. 本地运行 lint、test、build。
4. 使用规范 commit message 提交。
5. 推送分支到 GitHub。
6. 创建 Pull Request 到 `develop`。
7. GitHub Actions 自动执行检查。
8. 代码评审通过后合并。
9. 阶段完成后从 `develop` 创建 `release/<version>`。
10. 验收通过后合并到 `main`。
11. 在 `main` 分支打 tag。
12. GitHub 创建 Release 并归档验收材料。

## 6. PR 合并策略

- `feature/*` 到 `develop`：使用 Squash Merge，保持主线提交清晰。
- `fix/*` 到 `develop`：可使用 Squash Merge 或 Rebase Merge。
- `release/*` 到 `main`：使用 Merge Commit，保留发布分支历史。
- `hotfix/*` 到 `main`：使用 Merge Commit，并同步回 `develop`。

PR 必须满足：

- 至少 1 名 Reviewer 通过。
- GitHub Actions 全部通过。
- 无 P0/P1 未关闭缺陷。
- 涉及数据库变更必须包含迁移脚本和回滚说明。
- 涉及接口变更必须更新 API 文档。
- 涉及验收范围必须同步测试用例或验收清单。

## 7. 回滚策略

代码级回滚：

```bash
git revert <commit-sha>
git push origin <branch>
```

版本级回滚：

```bash
git checkout main
git checkout -b hotfix/rollback-v1.0.0
git revert <release-merge-sha>
git push -u origin hotfix/rollback-v1.0.0
```

部署级回滚：

- 保留上一版本 Docker 镜像。
- Nginx 或部署平台切回上一版本容器。
- 数据库变更必须先评估是否需要执行回滚迁移。
- 回滚后补充 GitHub Issue、事故记录和 Release Note。

## 8. 验收版本封版流程

```bash
git checkout develop
git pull origin develop

git checkout -b release/v1.0.0

# 只允许修复验收缺陷、版本号、文档、部署配置
git add .
git commit -m "chore: prepare v1.0.0 acceptance release"

git checkout main
git pull origin main
git merge --no-ff release/v1.0.0

git tag -a v1.0.0 -m "v1.0.0 acceptance release"
git push origin main
git push origin v1.0.0

git checkout develop
git merge --no-ff release/v1.0.0
git push origin develop
```

GitHub Release 归档内容：

- 发布说明
- 验收范围
- 功能清单
- 已知限制
- 部署镜像版本
- 数据库迁移版本
- 测试报告
- 验收文档

## 9. GitHub Actions 建议

建议流水线包含：

- 前端 lint/typecheck/build
- 后端 lint/test/build
- 数据库迁移检查
- Docker 镜像构建
- 依赖安全扫描
- 测试报告归档

分支触发建议：

- `feature/*`：lint、test、build。
- `develop`：完整 CI，部署测试环境。
- `release/*`：完整 CI，部署预发环境。
- `main`：完整 CI，构建生产镜像，创建 Release 草稿。
