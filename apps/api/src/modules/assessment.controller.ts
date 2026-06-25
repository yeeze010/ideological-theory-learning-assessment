import { Body, Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import type { UserProfile } from "@assessment/shared";
import { AssessmentService } from "./assessment.service";
import { AuthGuard } from "./auth.guard";
import { CreateCourseDto, CreateQuestionDto, LoginDto, SubmitExamDto } from "./dto";
import { Roles } from "./roles.decorator";

type AuthenticatedRequest = Request & { user: UserProfile };

@ApiTags("assessment")
@Controller()
export class AssessmentController {
  constructor(private readonly service: AssessmentService) {}

  @Post("auth/login")
  login(@Body() dto: LoginDto) {
    return this.service.login(dto.role, dto.username, dto.password);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get("dashboard/overview")
  overview(@Req() request: AuthenticatedRequest) {
    return this.service.overview(request.user);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get("courses")
  listCourses(@Req() request: AuthenticatedRequest) {
    return this.service.listCourses(request.user);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Roles("platform_admin", "org_admin", "course_admin")
  @Post("courses")
  createCourse(@Body() dto: CreateCourseDto, @Req() request: AuthenticatedRequest) {
    return this.service.createCourse(dto, request.user);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Roles("platform_admin", "org_admin", "course_admin", "question_admin")
  @Get("questions")
  listQuestions() {
    return this.service.listQuestions();
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Roles("platform_admin", "org_admin", "question_admin")
  @Post("questions")
  createQuestion(@Body() dto: CreateQuestionDto, @Req() request: AuthenticatedRequest) {
    return this.service.createQuestion(dto, request.user);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get("exam-plans")
  listExams(@Req() request: AuthenticatedRequest) {
    return this.service.listExams(request.user);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Roles("platform_admin", "org_admin", "course_admin", "supervisor", "auditor")
  @Get("audit-logs")
  listAuditLogs() {
    return this.service.listAuditLogs();
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Roles("learner")
  @Get("exam-plans/:id/entry")
  examEntry(@Param("id") id: string, @Req() request: AuthenticatedRequest) {
    return this.service.examEntry(id, request.user);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Roles("learner")
  @Post("exam-attempts/:id/submit")
  submitExam(@Param("id") id: string, @Body() dto: SubmitExamDto, @Req() request: AuthenticatedRequest) {
    return this.service.submitExam(id, dto, request.user);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get("learning/profile")
  learningProfile(@Req() request: AuthenticatedRequest) {
    return this.service.learningProfile(request.user);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get("learning/recommendations")
  learningRecommendations(@Req() request: AuthenticatedRequest) {
    return this.service.learningRecommendations(request.user);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Roles("platform_admin", "org_admin", "course_admin", "supervisor")
  @Get("learning/alerts")
  learningAlerts(@Req() request: AuthenticatedRequest) {
    return this.service.learningAlerts(request.user);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Roles("platform_admin", "org_admin", "course_admin", "question_admin", "supervisor")
  @Get("reviews/pending")
  pendingReviews(@Req() request: AuthenticatedRequest) {
    return this.service.pendingReviews(request.user);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Roles("platform_admin", "org_admin", "course_admin", "question_admin", "supervisor")
  @Post("reviews/:id/approve")
  approveReview(@Param("id") id: string, @Req() request: AuthenticatedRequest) {
    return this.service.approveReview(id, request.user);
  }
}
