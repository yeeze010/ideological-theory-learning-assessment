import type { RoleCode, UserProfile } from "@assessment/shared";
import { defineStore } from "pinia";
import { api, clearToken, getToken, setToken } from "../api/client.ts";

export const useSessionStore = defineStore("session", {
  state: () => ({
    profile: null as UserProfile | null,
    initialized: false,
    loading: false,
    permissionMessage: ""
  }),
  actions: {
    async login(role: RoleCode, username: string, password: string) {
      this.loading = true;
      try {
        const data = await api.login(role, username, password);
        setToken(data.token);
        this.profile = data.profile;
        this.initialized = true;
      } finally {
        this.loading = false;
      }
    },
    async restore() {
      if (this.initialized) return this.profile;
      if (!getToken()) {
        this.initialized = true;
        return null;
      }
      this.loading = true;
      try {
        this.profile = await api.me();
        return this.profile;
      } catch {
        this.clearSession();
        return null;
      } finally {
        this.loading = false;
        this.initialized = true;
      }
    },
    clearSession() {
      clearToken();
      this.profile = null;
      this.initialized = true;
    },
    logout() {
      this.clearSession();
      this.permissionMessage = "";
    },
    showPermissionDenied(message: string) {
      this.permissionMessage = message || "当前角色无权执行此操作";
    },
    dismissPermissionMessage() {
      this.permissionMessage = "";
    }
  }
});
