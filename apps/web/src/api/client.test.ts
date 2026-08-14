import assert from "node:assert/strict";
import test from "node:test";
import { api, ApiError, configureApiHandlers, getToken, setToken } from "./client.ts";

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

test("API统一发送Bearer Token，403提示权限不足但不清除会话", async () => {
  globalThis.localStorage = new MemoryStorage();
  setToken("signed-token");
  let forbiddenMessage = "";
  let unauthorized = false;
  let authorization = "";

  configureApiHandlers({
    unauthorized: () => { unauthorized = true; },
    forbidden: (message) => { forbiddenMessage = message; }
  });
  globalThis.fetch = async (_input, init) => {
    authorization = new Headers(init?.headers).get("Authorization") ?? "";
    return new Response(JSON.stringify({ message: "当前角色无权查看审计记录" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  };

  await assert.rejects(api.auditLogs(), (error: unknown) => error instanceof ApiError && error.status === 403);
  assert.equal(authorization, "Bearer signed-token");
  assert.equal(forbiddenMessage, "当前角色无权查看审计记录");
  assert.equal(unauthorized, false);
  assert.equal(getToken(), "signed-token");
});
