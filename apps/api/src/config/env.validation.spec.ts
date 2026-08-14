import { validateEnvironment } from "./env.validation";

describe("validateEnvironment", () => {
  it("rejects missing and known default JWT secrets", () => {
    expect(() => validateEnvironment({ DATABASE_URL: "postgresql://user:pass@localhost/db" })).toThrow("JWT_SECRET");
    expect(() => validateEnvironment({ JWT_SECRET: "change-me-in-production", DATABASE_URL: "postgresql://user:pass@localhost/db" })).toThrow("JWT_SECRET");
  });

  it("accepts an explicit strong secret and PostgreSQL URL", () => {
    const environment = validateEnvironment({
      JWT_SECRET: "test-only-random-secret-with-32-chars-minimum",
      DATABASE_URL: "postgresql://user:pass@localhost/db"
    });
    expect(environment.JWT_ISSUER).toBe("ideological-theory-learning-assessment");
    expect(environment.JWT_AUDIENCE).toBe("assessment-web");
  });
});
