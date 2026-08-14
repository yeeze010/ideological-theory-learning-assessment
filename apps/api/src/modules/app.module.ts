import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { validateEnvironment } from "../config/env.validation";
import { DatabaseModule } from "../database/database.module";
import { AssessmentRepository } from "./assessment.repository";
import { AssessmentController } from "./assessment.controller";
import { AssessmentService } from "./assessment.service";
import { AuthGuard } from "./auth.guard";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment }), DatabaseModule],
  controllers: [AuthController, AssessmentController],
  providers: [AssessmentRepository, AssessmentService, AuthService, AuthGuard]
})
export class AppModule {}
