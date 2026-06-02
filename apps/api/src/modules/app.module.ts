import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AssessmentController } from "./assessment.controller";
import { AssessmentService } from "./assessment.service";
import { AuthGuard } from "./auth.guard";

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [AssessmentController],
  providers: [AssessmentService, AuthGuard]
})
export class AppModule {}
