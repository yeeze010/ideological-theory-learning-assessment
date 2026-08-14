import type { RoleCode, UserProfile } from "@assessment/shared";

export interface AuthenticatedUser extends UserProfile {
  tenantId: string;
  orgId: string;
  tokenVersion: number;
}

export interface AccessTokenPayload {
  sub: string;
  tenantId: string;
  orgId: string;
  activeRole: RoleCode;
  tokenVersion: number;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string | string[];
}
