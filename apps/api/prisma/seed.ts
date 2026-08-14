import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { ROLE_CODES, type RoleCode } from "@assessment/shared";

const prisma = new PrismaClient();

const roleDefinitions: Record<RoleCode, { name: string; description: string }> = {
  platform_admin: { name: "平台管理员", description: "负责租户、组织、角色、审计和全局配置" },
  org_admin: { name: "院系管理员", description: "负责本院系用户、课程和考核治理" },
  course_admin: { name: "任课教师", description: "负责课程、考试、学习干预和成绩管理" },
  question_admin: { name: "题库管理员", description: "负责试题建设、复核和题库质量" },
  supervisor: { name: "学习督导员", description: "负责学习预警、督导和闭环跟踪" },
  learner: { name: "学习者", description: "参加课程学习、练习和考试" },
  auditor: { name: "审计员", description: "查看审计记录和评价过程证据" }
};

const accountDefinitions: Array<{
  id: string;
  username: string;
  name: string;
  role: RoleCode;
  orgId: string;
  scopeType: "tenant" | "org" | "self";
  passwordVariable: string;
}> = [
  { id: "u-platform", username: "admin", name: "平台管理员", role: "platform_admin", orgId: "org-school", scopeType: "tenant", passwordVariable: "SEED_PLATFORM_ADMIN_PASSWORD" },
  { id: "u-org", username: "orgadmin", name: "院系管理员", role: "org_admin", orgId: "org-marx", scopeType: "org", passwordVariable: "SEED_ORG_ADMIN_PASSWORD" },
  { id: "u-teacher", username: "teacher", name: "任课教师", role: "course_admin", orgId: "org-marx", scopeType: "org", passwordVariable: "SEED_COURSE_ADMIN_PASSWORD" },
  { id: "u-question", username: "question", name: "题库管理员", role: "question_admin", orgId: "org-question", scopeType: "org", passwordVariable: "SEED_QUESTION_ADMIN_PASSWORD" },
  { id: "u-supervisor", username: "supervisor", name: "学习督导员", role: "supervisor", orgId: "org-class", scopeType: "org", passwordVariable: "SEED_SUPERVISOR_PASSWORD" },
  { id: "u-learner", username: "student", name: "张同学", role: "learner", orgId: "org-class", scopeType: "self", passwordVariable: "SEED_LEARNER_PASSWORD" },
  { id: "u-auditor", username: "auditor", name: "审计员", role: "auditor", orgId: "org-school", scopeType: "tenant", passwordVariable: "SEED_AUDITOR_PASSWORD" }
];

function seedPassword(variable: string): string {
  const password = process.env[variable]?.trim() ?? "";
  if (password.length < 12) {
    throw new Error(`${variable} 必须通过环境变量提供，且长度不少于 12 个字符`);
  }
  return password;
}

async function main(): Promise<void> {
  const tenant = await prisma.tenant.upsert({
    where: { code: "ncu-vocational" },
    create: { id: "tenant-ncu", code: "ncu-vocational", name: "南昌职业大学" },
    update: { name: "南昌职业大学", status: "enabled" }
  });

  const organizations = [
    { id: "org-school", name: "南昌职业大学", parentId: null, sort: 1 },
    { id: "org-marx", name: "马克思主义学院", parentId: "org-school", sort: 10 },
    { id: "org-question", name: "马克思主义学院 题库中心", parentId: "org-marx", sort: 20 },
    { id: "org-class", name: "2026级一班", parentId: "org-marx", sort: 30 }
  ];
  for (const org of organizations) {
    await prisma.org.upsert({
      where: { id: org.id },
      create: { ...org, tenantId: tenant.id },
      update: { name: org.name, parentId: org.parentId, sort: org.sort }
    });
  }

  const roles = new Map<RoleCode, string>();
  for (const code of ROLE_CODES) {
    const role = await prisma.role.upsert({
      where: { code },
      create: { code, ...roleDefinitions[code] },
      update: roleDefinitions[code]
    });
    roles.set(code, role.id);
  }

  for (const account of accountDefinitions) {
    const passwordHash = await bcrypt.hash(seedPassword(account.passwordVariable), 12);
    const user = await prisma.user.upsert({
      where: { tenantId_username: { tenantId: tenant.id, username: account.username } },
      create: {
        id: account.id,
        tenantId: tenant.id,
        orgId: account.orgId,
        username: account.username,
        name: account.name,
        passwordHash,
        passwordChangedAt: new Date()
      },
      update: {
        orgId: account.orgId,
        name: account.name,
        passwordHash,
        passwordChangedAt: new Date(),
        status: "enabled",
        tokenVersion: { increment: 1 },
        failedLoginCount: 0,
        lockedUntil: null
      }
    });
    const roleId = roles.get(account.role)!;
    const scopeId = account.scopeType === "tenant" ? tenant.id : account.scopeType === "org" ? account.orgId : user.id;
    const assignment = await prisma.userRole.findFirst({
      where: { userId: user.id, roleId, scopeType: account.scopeType, scopeId }
    });
    if (!assignment) {
      await prisma.userRole.create({
        data: { userId: user.id, roleId, scopeType: account.scopeType, scopeId }
      });
    }
  }

  const courses = [
    { id: "course-1", title: "习近平新时代中国特色社会主义思想概论", category: "必修课程", status: "published", requiredMinutes: 180 },
    { id: "course-2", title: "马克思主义基本原理专题学习", category: "理论专题", status: "published", requiredMinutes: 120 },
    { id: "course-3", title: "党史学习教育专题", category: "专题教育", status: "draft", requiredMinutes: 90 }
  ];
  for (const course of courses) {
    await prisma.course.upsert({
      where: { id: course.id },
      create: { ...course, tenantId: tenant.id },
      update: course
    });
  }

  const questions = [
    { id: "q-1", bankName: "理论基础题库", type: "single", difficulty: "easy", stem: "中国特色社会主义最本质的特征是什么？", options: ["人民当家作主", "中国共产党领导", "依法治国", "共同富裕"], answer: ["中国共产党领导"], knowledgePoints: ["党的领导"], score: 20 },
    { id: "q-2", bankName: "理论基础题库", type: "multiple", difficulty: "medium", stem: "思想理论学习过程评价通常包括哪些数据？", options: ["学习时长", "章节完成情况", "考试成绩", "无关浏览记录"], answer: ["学习时长", "章节完成情况", "考试成绩"], knowledgePoints: ["过程性评价"], score: 30 },
    { id: "q-3", bankName: "党史学习题库", type: "judge", difficulty: "easy", stem: "考试成绩发布后仍应保留题目与答案快照，便于追溯。", options: ["正确", "错误"], answer: ["正确"], knowledgePoints: ["评价追溯"], score: 20 },
    { id: "q-4", bankName: "党史学习题库", type: "single", difficulty: "medium", stem: "后台数据范围权限主要用于解决什么问题？", options: ["限制跨组织数据访问", "提升页面动画", "替代数据库备份", "关闭审计日志"], answer: ["限制跨组织数据访问"], knowledgePoints: ["数据权限"], score: 30 }
  ];
  for (const question of questions) {
    await prisma.question.upsert({
      where: { id: question.id },
      create: { ...question, tenantId: tenant.id, status: "published", createdById: "u-question" },
      update: { ...question, status: "published" }
    });
  }

  await prisma.courseEnrollment.upsert({
    where: { courseId_userId: { courseId: "course-1", userId: "u-learner" } },
    create: { courseId: "course-1", userId: "u-learner", completionRate: 76, studyMinutes: 146, completedTasks: 7, pendingTasks: 2 },
    update: { completionRate: 76, studyMinutes: 146, completedTasks: 7, pendingTasks: 2 }
  });
  await prisma.courseEnrollment.upsert({
    where: { courseId_userId: { courseId: "course-2", userId: "u-learner" } },
    create: { courseId: "course-2", userId: "u-learner", completionRate: 68, studyMinutes: 92, completedTasks: 4, pendingTasks: 1 },
    update: { completionRate: 68, studyMinutes: 92, completedTasks: 4, pendingTasks: 1 }
  });

  const now = Date.now();
  await prisma.examPlan.upsert({
    where: { id: "exam-1" },
    create: {
      id: "exam-1",
      courseId: "course-1",
      title: "思政理论阶段性考核",
      status: "running",
      startAt: new Date(now - 24 * 60 * 60 * 1000),
      endAt: new Date(now + 30 * 24 * 60 * 60 * 1000),
      durationMinutes: 60,
      passScore: 60
    },
    update: {
      status: "running",
      startAt: new Date(now - 24 * 60 * 60 * 1000),
      endAt: new Date(now + 30 * 24 * 60 * 60 * 1000)
    }
  });
  for (const [index, question] of questions.entries()) {
    await prisma.examPlanQuestion.upsert({
      where: { examPlanId_questionId: { examPlanId: "exam-1", questionId: question.id } },
      create: { examPlanId: "exam-1", questionId: question.id, sort: index + 1, score: question.score },
      update: { sort: index + 1, score: question.score }
    });
  }

  await prisma.reviewTask.upsert({
    where: { id: "review-1" },
    create: { id: "review-1", type: "recommendation", title: "为张同学推送数据权限与评价追溯补弱材料", submittedBy: "学习画像引擎", targetRole: "course_admin" },
    update: { status: "pending", comment: null, reviewedAt: null, reviewerId: null }
  });
  await prisma.reviewTask.upsert({
    where: { id: "review-2" },
    create: { id: "review-2", type: "question", title: "复核过程性评价题目区分度偏低问题", submittedBy: "题库质量巡检", targetRole: "question_admin" },
    update: { status: "pending", comment: null, reviewedAt: null, reviewerId: null }
  });

  await prisma.learningRecommendation.upsert({
    where: { id: "rec-seed-1" },
    create: { id: "rec-seed-1", learnerId: "u-learner", type: "practice", title: "补弱：数据权限", knowledgePoint: "数据权限", reason: "阶段诊断显示该知识点需要强化", priority: "high" },
    update: { status: "pending_review", resolvedAt: null }
  });
  await prisma.learningAlert.upsert({
    where: { id: "alert-seed-1" },
    create: { id: "alert-seed-1", learnerId: "u-learner", level: "critical", title: "张同学在数据权限知识点存在薄弱风险", reason: "阶段诊断掌握度低于预警阈值", ownerRole: "course_admin" },
    update: { status: "open", resolvedAt: null }
  });
  await prisma.auditLog.upsert({
    where: { id: "audit-seed-1" },
    create: { id: "audit-seed-1", tenantId: tenant.id, actorId: "u-platform", actorName: "平台管理员", action: "初始化系统基线数据", resourceType: "system", resourceName: "思政理论学习考核评价系统" },
    update: {}
  });
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
