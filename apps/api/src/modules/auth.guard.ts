import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import jwt from "jsonwebtoken";
import type { RoleCode, UserProfile } from "@assessment/shared";
import { ROLES_KEY } from "./roles.decorator";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ headers: Record<string, string>; user?: UserProfile }>();
    const header = request.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw new UnauthorizedException("请先登录");
    }

    try {
      request.user = jwt.verify(header.slice(7), process.env.JWT_SECRET ?? "dev-secret") as UserProfile;
    } catch {
      throw new UnauthorizedException("登录状态已失效");
    }

    const roles = this.reflector.getAllAndOverride<RoleCode[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass()
    ]);
    if (roles?.length && !roles.includes(request.user.role)) {
      throw new ForbiddenException("当前角色无权访问该功能");
    }

    return true;
  }
}
