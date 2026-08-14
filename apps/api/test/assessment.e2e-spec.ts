import { ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AssessmentController } from "../src/modules/assessment.controller";
import { AssessmentService } from "../src/modules/assessment.service";
import { AuthController } from "../src/modules/auth.controller";
import { AuthGuard } from "../src/modules/auth.guard";
import { AuthService } from "../src/modules/auth.service";

describe("assessment HTTP routes", () => {
  let app: INestApplication;
  const authService = {
    login: jest.fn().mockResolvedValue({ token: "test-token", profile: { role: "learner" } }),
    authenticateToken: jest.fn().mockResolvedValue({
      id: "u-learner",
      tenantId: "tenant-1",
      orgId: "org-class",
      tokenVersion: 0,
      name: "张同学",
      username: "student",
      role: "learner",
      orgName: "2026级一班"
    })
  };
  const assessmentService = {
    overview: jest.fn().mockResolvedValue({ learnerCount: 1, courseCount: 1, examCount: 1, passRate: 0, completionRate: 0, pendingReviews: 0, riskAlerts: 0 })
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [AuthController, AssessmentController],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: AssessmentService, useValue: assessmentService },
        {
          provide: AuthGuard,
          useValue: {
            canActivate: (context: { switchToHttp: () => { getRequest: () => { user: unknown } } }) => {
              context.switchToHttp().getRequest().user = authService.authenticateToken.mock.results[0]?.value;
              return true;
            }
          }
        }
      ]
    }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix("api");
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("validates the three-part login contract and forwards all fields", async () => {
    await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ role: "learner", username: "student", password: "Student@123" })
      .expect(201);
    expect(authService.login).toHaveBeenCalledWith("learner", "student", "Student@123");

    await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ role: "not-a-role", username: "student", password: "Student@123" })
      .expect(400);
  });

  it("serves a protected overview route through the auth guard", async () => {
    await request(app.getHttpServer())
      .get("/api/dashboard/overview")
      .set("Authorization", "Bearer test-token")
      .expect(200)
      .expect(({ body }) => expect(body.learnerCount).toBe(1));
    expect(assessmentService.overview).toHaveBeenCalled();
  });
});
