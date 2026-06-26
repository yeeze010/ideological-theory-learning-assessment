# 仓库协作规范

## 1. 分支策略

- `main`：验收通过版本。
- `develop`：日常集成分支。
- `feature/*`：功能开发。
- `fix/*`：缺陷修复。
- `release/*`：验收候选版本。
- `hotfix/*`：线上紧急修复。

## 2. 提交与评审要求

- 提交信息使用 Conventional Commits。
- PR 必须说明变更范围、验证方式、风险与回滚点。
- 涉及 API、权限、数据模型、验收范围的改动，必须同步更新文档。

## 3. GitHub 模板

本仓库已补齐：

- `/.github/ISSUE_TEMPLATE/bug_report.md`
- `/.github/ISSUE_TEMPLATE/feature_request.md`
- `/.github/pull_request_template.md`
- `/.github/CODEOWNERS`

## 4. CI/CD 基线

当前 CI 已覆盖：

- 依赖安装
- shared 包构建
- API 测试
- API 构建
- Web typecheck
- Web 构建

建议后续继续补齐：

- API lint
- Web E2E 或组件测试
- Prisma 迁移检查
- Docker 镜像构建
- 依赖漏洞与许可证扫描
