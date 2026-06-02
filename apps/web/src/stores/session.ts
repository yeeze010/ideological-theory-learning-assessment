import type { UserProfile } from "@assessment/shared";
import { defineStore } from "pinia";
import { api, clearToken, setToken } from "@/api/client";

export const useSessionStore = defineStore("session", {
  state: () => ({
    profile: JSON.parse(localStorage.getItem("assessment_profile") ?? "null") as UserProfile | null,
    loading: false
  }),
  actions: {
    async login(username: string, password: string) {
      this.loading = true;
      try {
        const data = await api.login(username, password);
        setToken(data.token);
        this.profile = data.profile;
        localStorage.setItem("assessment_profile", JSON.stringify(data.profile));
      } finally {
        this.loading = false;
      }
    },
    logout() {
      clearToken();
      localStorage.removeItem("assessment_profile");
      this.profile = null;
    }
  }
});
