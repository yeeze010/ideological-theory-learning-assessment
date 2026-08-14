# API 模块说明

当前 API 是可演示 MVP，使用内存种子数据保证本地无需数据库也能启动。

已实现接口：

- `POST /api/auth/login`
- `GET /api/dashboard/overview`
- `GET /api/courses`
- `POST /api/courses`
- `GET /api/questions`
- `POST /api/questions`
- `GET /api/exam-plans`
- `GET /api/exam-plans/:id/entry`
- `POST /api/exam-attempts/:id/submit`

生产化迭代建议：

- 接入 Prisma Client，并将内存数据替换为 PostgreSQL。
- Redis 保存考试临时答案和验证码。
- MinIO 提供课程资源、证书文件、导入模板存储。
- 增加数据范围过滤、操作审计拦截器、导出限流和题目快照表。
