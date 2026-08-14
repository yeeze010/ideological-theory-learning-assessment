import assert from "node:assert/strict";
import test from "node:test";
import { createEmptyLoginForm, validateLoginForm } from "./login-form.ts";
import { hasPermission, homePathForRole, ROLE_DEFINITIONS } from "./roles.ts";

test("登录表单初始状态不预填角色、用户名和密码", () => {
  const form = createEmptyLoginForm();
  assert.deepEqual(form, { role: "", username: "", password: "" });
  assert.deepEqual(validateLoginForm(form), {
    role: "请选择与账号一致的角色",
    username: "请输入用户名",
    password: "请输入密码"
  });
});

test("前端提供七种后端角色，题库管理员可进入题库路由", () => {
  assert.deepEqual(
    ROLE_DEFINITIONS.map((item) => item.code),
    [
      "platform_admin",
      "org_admin",
      "course_admin",
      "question_admin",
      "supervisor",
      "learner",
      "auditor"
    ]
  );
  assert.equal(hasPermission("question_admin", "question:view"), true);
  assert.equal(hasPermission("question_admin", "question:create"), true);
  assert.equal(homePathForRole("question_admin"), "/questions");
  assert.equal(hasPermission("learner", "audit:view"), false);
});
