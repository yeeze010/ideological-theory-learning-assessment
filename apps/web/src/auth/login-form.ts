import type { RoleCode } from "@assessment/shared";

export interface LoginFormState {
  role: RoleCode | "";
  username: string;
  password: string;
}

export interface LoginFormErrors {
  role?: string;
  username?: string;
  password?: string;
}

export function createEmptyLoginForm(): LoginFormState {
  return { role: "", username: "", password: "" };
}

export function validateLoginForm(form: LoginFormState): LoginFormErrors {
  const errors: LoginFormErrors = {};
  if (!form.role) errors.role = "请选择与账号一致的角色";
  if (!form.username.trim()) errors.username = "请输入用户名";
  if (!form.password) errors.password = "请输入密码";
  return errors;
}
