import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import { createPinia } from "pinia";
import { createApp } from "vue";
import App from "./App.vue";
import { configureApiHandlers } from "./api/client";
import { router } from "./router";
import { useSessionStore } from "./stores/session";
import "./styles.css";

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);

const session = useSessionStore(pinia);
configureApiHandlers({
  unauthorized: () => {
    session.clearSession();
    if (router.currentRoute.value.path !== "/login") {
      void router.replace({ path: "/login", query: { reason: "expired" } });
    }
  },
  forbidden: (message) => session.showPermissionDenied(message)
});

app.use(router).use(ElementPlus).mount("#app");
