import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import type { RoleCode } from "@assessment/shared";
import { AuthService } from "./auth.service";
import type { AuthenticatedUser } from "./auth.types";
import { ROLES_KEY } from "./roles.decorator";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const header = request.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw new UnauthorizedException("请先登录");
    }

    request.user = await this.authService.authenticateToken(header.slice(7));
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
