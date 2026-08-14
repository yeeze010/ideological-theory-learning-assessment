import assert from "node:assert/strict";
import test from "node:test";
import { createPinia, setActivePinia } from "pinia";
import type { UserProfile } from "@assessment/shared";
import { api, setToken } from "../api/client.ts";
import { useSessionStore } from "./session.ts";

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

test("应用启动时通过auth/me恢复身份，不读取本地用户资料", async () => {
  globalThis.localStorage = new MemoryStorage();
  setToken("signed-token");
  setActivePinia(createPinia());
  const expected: UserProfile = {
    id: "u-question",
    name: "题库管理员",
    username: "question",
    role: "question_admin",
    orgName: "马克思主义学院 题库中心"
  };
  const originalMe = api.me;
  let calls = 0;
  api.me = async () => {
    calls += 1;
    return expected;
  };

  try {
    const session = useSessionStore();
    const profile = await session.restore();
    assert.deepEqual(profile, expected);
    assert.deepEqual(session.profile, expected);
    assert.equal(session.initialized, true);
    assert.equal(calls, 1);
    await session.restore();
    assert.equal(calls, 1);
  } finally {
    api.me = originalMe;
  }
});
