import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import type { RoleCode, UserProfile } from "@assessment/shared";
import { AssessmentRepository, type AuthUserRecord } from "./assessment.repository";
import type { AccessTokenPayload, AuthenticatedUser } from "./auth.types";

@Injectable()
export class AuthService {
  constructor(
    private readonly repository: AssessmentRepository,
    private readonly config: ConfigService
  ) {}

  async login(role: RoleCode, username: string, password: string) {
    const user = await this.repository.findUserForLogin(username.trim());
    const valid = user
      && user.status === "enabled"
      && user.roles.includes(role)
      && (!user.lockedUntil || user.lockedUntil.getTime() <= Date.now())
      && await bcrypt.compare(password, user.passwordHash);

    if (!valid || !user) {
      if (user) await this.repository.recordLoginFailure(user);
      throw new UnauthorizedException("角色、账号或密码不匹配");
    }

    await this.repository.recordLoginSuccess(user.id);
    const payload: AccessTokenPayload = {
      sub: user.id,
      tenantId: user.tenantId,
      orgId: user.orgId,
      activeRole: role,
      tokenVersion: user.tokenVersion
    };
    const token = jwt.sign(payload, this.secret, {
      expiresIn: this.config.get<string>("JWT_EXPIRES_IN", "30m") as SignOptions["expiresIn"],
      issuer: this.issuer,
      audience: this.audience,
      algorithm: "HS256"
    });
    const decoded = jwt.decode(token) as AccessTokenPayload;
    const profile = this.profile(user, role);
    await this.repository.writeAudit(this.authenticated(user, role), "登录系统", "user", user.username);
    return {
      token,
      accessToken: token,
      expiresAt: new Date((decoded.exp ?? 0) * 1000).toISOString(),
      profile
    };
  }

  async authenticateToken(token: string): Promise<AuthenticatedUser> {
    try {
      const payload = jwt.verify(token, this.secret, {
        algorithms: ["HS256"],
        issuer: this.issuer,
        audience: this.audience
      }) as AccessTokenPayload;
      if (!payload.sub || !payload.activeRole || !Number.isInteger(payload.tokenVersion)) {
        throw new Error("invalid token payload");
      }
      const user = await this.repository.findActiveUserById(payload.sub);
      if (
        !user
        || user.status !== "enabled"
        || user.tokenVersion !== payload.tokenVersion
        || user.tenantId !== payload.tenantId
        || user.orgId !== payload.orgId
        || !user.roles.includes(payload.activeRole)
      ) {
        throw new Error("stale user session");
      }
      return this.authenticated(user, payload.activeRole);
    } catch {
      throw new UnauthorizedException("登录状态已失效，请重新登录");
    }
  }

  private profile(user: AuthUserRecord, role: RoleCode): UserProfile {
    return {
      id: user.id,
      name: user.name,
      username: user.username,
      role,
      orgName: user.orgName
    };
  }

  private authenticated(user: AuthUserRecord, role: RoleCode): AuthenticatedUser {
    return {
      ...this.profile(user, role),
      tenantId: user.tenantId,
      orgId: user.orgId,
      tokenVersion: user.tokenVersion
    };
  }

  private get secret(): string {
    return this.config.getOrThrow<string>("JWT_SECRET");
  }

  private get issuer(): string {
    return this.config.get<string>("JWT_ISSUER", "ideological-theory-learning-assessment");
  }

  private get audience(): string {
    return this.config.get<string>("JWT_AUDIENCE", "assessment-web");
  }
}
