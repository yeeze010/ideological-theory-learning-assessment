import type { RoleCode } from "@assessment/shared";

export type PermissionCode =
  | "dashboard:view"
  | "profile:view"
  | "course:view"
  | "course:create"
  | "course:publish"
  | "record:view"
  | "question:view"
  | "question:create"
  | "question:publish"
  | "exam:view"
  | "exam:create"
  | "exam:attempt"
  | "review:view"
  | "review:approve"
  | "report:view"
  | "audit:view"
  | "class-results:view"
  | "intervention:create";

export interface RoleDefinition {
  code: RoleCode;
  label: string;
  scope: string;
  permissions: PermissionCode[];
}

export const ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    code: "platform_admin",
    label: "管理员",
    scope: "全校配置、课程、题库、审核、统计与审计",
    permissions: [
      "dashboard:view", "profile:view", "course:view", "course:create", "course:publish", "record:view",
      "question:view", "question:create", "question:publish", "exam:view", "exam:create", "review:view", "review:approve",
      "report:view", "audit:view", "class-results:view", "intervention:create"
    ]
  },
  {
    code: "org_admin",
    label: "辅导员 / 学院负责人",
    scope: "本组织课程、题库、审核、学习质量与审计",
    permissions: [
      "dashboard:view", "profile:view", "course:view", "course:create", "course:publish", "record:view",
      "question:view", "question:create", "question:publish", "exam:view", "exam:create", "review:view", "review:approve",
      "report:view", "audit:view", "class-results:view", "intervention:create"
    ]
  },
  {
    code: "course_admin",
    label: "教师",
    scope: "课程建设、考试安排、学情分析与阅卷复核",
    permissions: [
      "dashboard:view", "profile:view", "course:view", "course:create", "course:publish", "record:view",
      "question:view", "question:create", "question:publish", "exam:view", "exam:create", "review:view", "review:approve",
      "report:view", "class-results:view", "intervention:create"
    ]
  },
  {
    code: "question_admin",
    label: "题库管理员",
    scope: "题目维护、题目送审与题库审核",
    permissions: [
      "dashboard:view", "course:view", "question:view", "question:create", "question:publish", "exam:view",
      "review:view", "review:approve"
    ]
  },
  {
    code: "supervisor",
    label: "辅导员 / 学院负责人",
    scope: "教学质量巡查、学情预警、阅卷复核与统计",
    permissions: [
      "dashboard:view", "profile:view", "course:view", "record:view", "exam:view",
      "review:view", "review:approve", "report:view", "class-results:view", "intervention:create"
    ]
  },
  {
    code: "learner",
    label: "学生",
    scope: "本人课程、学习记录、在线考试与学习画像",
    permissions: [
      "dashboard:view", "profile:view", "course:view", "record:view", "exam:view", "exam:attempt"
    ]
  },
  {
    code: "auditor",
    label: "审计员",
    scope: "只读查看统计结果、考试计划与系统审计记录",
    permissions: ["dashboard:view", "course:view", "exam:view", "report:view", "audit:view"]
  }
];

export const LOGIN_ROLE_OPTIONS: Array<{ code: RoleCode; label: string; detail: string }> = [
  { code: "platform_admin", label: "管理员", detail: "平台管理员" },
  { code: "course_admin", label: "教师", detail: "任课教师" },
  { code: "learner", label: "学生", detail: "学习者" },
  { code: "org_admin", label: "辅导员 / 学院负责人", detail: "院系管理员" }
];

export function roleDefinition(role: RoleCode | undefined) {
  return ROLE_DEFINITIONS.find((item) => item.code === role);
}

export function hasPermission(role: RoleCode | undefined, permission: PermissionCode | undefined) {
  return permission ? Boolean(roleDefinition(role)?.permissions.includes(permission)) : true;
}

export function homePathForRole(role: RoleCode | undefined) {
  if (role === "question_admin") return "/questions";
  if (role === "auditor") return "/acceptance";
  return "/dashboard";
}
