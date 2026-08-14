import { Body, Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import { AssessmentService } from "./assessment.service";
import { AuthGuard } from "./auth.guard";
import type { AuthenticatedUser } from "./auth.types";
import { CreateCourseDto, CreateExamPlanDto, CreateInterventionDto, CreateQuestionDto, SubmitExamDto } from "./dto";
import { Roles } from "./roles.decorator";

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@ApiTags("assessment")
@Controller()
export class AssessmentController {
  constructor(private readonly service: AssessmentService) {}

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
  @Roles("platform_admin", "org_admin", "course_admin")
  @Post("courses/:id/publish")
  publishCourse(@Param("id") id: string, @Req() request: AuthenticatedRequest) {
    return this.service.publishCourse(id, request.user);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Roles("platform_admin", "org_admin", "course_admin", "question_admin")
  @Get("questions")
  listQuestions(@Req() request: AuthenticatedRequest) {
    return this.service.listQuestions(request.user);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Roles("platform_admin", "org_admin", "course_admin", "question_admin")
  @Post("questions")
  createQuestion(@Body() dto: CreateQuestionDto, @Req() request: AuthenticatedRequest) {
    return this.service.createQuestion(dto, request.user);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Roles("platform_admin", "org_admin", "course_admin", "question_admin")
  @Post("questions/:id/publish")
  publishQuestion(@Param("id") id: string, @Req() request: AuthenticatedRequest) {
    return this.service.publishQuestion(id, request.user);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Roles("platform_admin", "org_admin", "course_admin")
  @Post("exam-plans")
  createExamPlan(@Body() dto: CreateExamPlanDto, @Req() request: AuthenticatedRequest) {
    return this.service.createExamPlan(dto, request.user);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get("exam-plans")
  listExams(@Req() request: AuthenticatedRequest) {
    return this.service.listExams(request.user);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Roles("platform_admin", "org_admin", "course_admin", "supervisor")
  @Get("learning/class-results")
  classResults(@Req() request: AuthenticatedRequest) {
    return this.service.classResults(request.user);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Roles("platform_admin", "org_admin", "course_admin", "supervisor")
  @Post("learning/interventions")
  createIntervention(@Body() dto: CreateInterventionDto, @Req() request: AuthenticatedRequest) {
    return this.service.createIntervention(dto, request.user);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Roles("platform_admin", "org_admin", "course_admin", "supervisor", "auditor")
  @Get("audit-logs")
  listAuditLogs(@Req() request: AuthenticatedRequest) {
    return this.service.listAuditLogs(request.user);
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
