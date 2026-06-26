# 数据库表设计

## 核心表

| 表名 | 用途 | 关键字段 |
|---|---|---|
| `users` | 用户账号 | id、username、name、phone、email、status、last_login_at |
| `roles` | 角色 | id、code、name、description |
| `permissions` | 权限码 | id、code、name、module |
| `user_roles` | 用户角色 | user_id、role_id、scope_type、scope_id |
| `org_units` | 组织架构 | id、parent_id、type、name、code |
| `classes` | 班级 | id、department_id、major、grade、name |
| `courses` | 课程 | id、title、category、cover_file_id、status、owner_id |
| `course_chapters` | 课程章节 | id、course_id、parent_id、title、sort_order、required_minutes |
| `learning_tasks` | 学习任务 | id、title、course_id、publisher_id、start_at、end_at、complete_rule |
| `task_targets` | 任务对象 | task_id、target_type、target_id |
| `learning_records` | 学习记录 | id、task_id、course_id、chapter_id、user_id、progress、duration_seconds、completed_at |
| `question_banks` | 题库 | id、name、scope_type、scope_id、status |
| `questions` | 题目 | id、bank_id、type、difficulty、stem、analysis、score、status、version |
| `question_options` | 选项 | id、question_id、label、content、is_correct |
| `papers` | 试卷 | id、title、mode、total_score、pass_score、status |
| `paper_questions` | 试卷题目 | paper_id、question_id、score、sort_order |
| `exams` | 考试 | id、paper_id、title、start_at、end_at、duration_minutes、attempt_limit |
| `exam_attempts` | 考试记录 | id、exam_id、user_id、status、started_at、submitted_at、score |
| `answers` | 答案 | id、attempt_id、question_id、answer_text、answer_json、auto_score、manual_score |
| `marking_tasks` | 阅卷任务 | id、attempt_id、question_id、marker_id、status、score、comment |
| `credits` | 积分明细 | id、user_id、source_type、source_id、points、reason |
| `certificates` | 证书 | id、user_id、exam_id、certificate_no、file_id、issued_at |
| `learning_reports` | 学习报告 | id、user_id、period_type、period_key、file_id、summary_json |
| `files` | 文件元数据 | id、bucket、object_key、filename、mime_type、size、sha256、owner_id |
| `notifications` | 通知 | id、user_id、type、title、content、read_at |
| `audit_logs` | 审计日志 | id、actor_id、action、object_type、object_id、snapshot_json、created_at |

## 索引建议

- `learning_records(user_id, task_id)` 唯一约束，避免重复记录。
- `exam_attempts(exam_id, user_id, status)` 加速考试状态查询。
- `answers(attempt_id, question_id)` 唯一约束，保证单题答案唯一。
- `credits(user_id, source_type, source_id)` 防止重复积分。
- `audit_logs(created_at, actor_id, object_type)` 支持审计筛选。

## 快照策略

考试开始时固化试卷和题目快照，避免题库更新影响已开考考试。证书和学习报告生成时保存统计快照，保证历史报告可复现。
