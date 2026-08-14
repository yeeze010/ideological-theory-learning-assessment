const prohibitedSecrets = new Set([
  "dev-secret",
  "change-me-in-production",
  "replace-me",
  "secret"
]);

export interface ApplicationEnvironment {
  JWT_SECRET: string;
  JWT_ISSUER: string;
  JWT_AUDIENCE: string;
  JWT_EXPIRES_IN: string;
  DATABASE_URL: string;
  PORT?: string;
  CORS_ORIGIN?: string;
}

export function validateEnvironment(input: Record<string, unknown>): ApplicationEnvironment {
  const jwtSecret = String(input.JWT_SECRET ?? "").trim();
  if (jwtSecret.length < 32 || prohibitedSecrets.has(jwtSecret.toLowerCase())) {
    throw new Error("JWT_SECRET 必须是至少 32 个字符的非默认随机密钥");
  }

  const databaseUrl = String(input.DATABASE_URL ?? "").trim();
  if (!/^postgres(?:ql)?:\/\//i.test(databaseUrl)) {
    throw new Error("DATABASE_URL 必须是有效的 PostgreSQL 连接地址");
  }

  return {
    ...input,
    JWT_SECRET: jwtSecret,
    JWT_ISSUER: String(input.JWT_ISSUER ?? "ideological-theory-learning-assessment"),
    JWT_AUDIENCE: String(input.JWT_AUDIENCE ?? "assessment-web"),
    JWT_EXPIRES_IN: String(input.JWT_EXPIRES_IN ?? "30m"),
    DATABASE_URL: databaseUrl
  } as ApplicationEnvironment;
}
