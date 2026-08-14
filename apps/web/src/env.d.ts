/// <reference types="vite/client" />

import "vue-router";
import type { PermissionCode } from "./auth/roles";

declare module "vue-router" {
  interface RouteMeta {
    public?: boolean;
    permission?: PermissionCode;
  }
}

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<object, object, unknown>;
  export default component;
}
