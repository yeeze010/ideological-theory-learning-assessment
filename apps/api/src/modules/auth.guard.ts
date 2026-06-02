import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import jwt from "jsonwebtoken";
import type { UserProfile } from "@assessment/shared";

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ headers: Record<string, string>; user?: UserProfile }>();
    const header = request.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw new UnauthorizedException("请先登录");
    }

    try {
      request.user = jwt.verify(header.slice(7), process.env.JWT_SECRET ?? "dev-secret") as UserProfile;
      return true;
    } catch {
      throw new UnauthorizedException("登录状态已失效");
    }
  }
}
