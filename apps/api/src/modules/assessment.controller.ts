import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AssessmentService } from "./assessment.service";
import { AuthGuard } from "./auth.guard";
import { CreateCourseDto, CreateQuestionDto, LoginDto, SubmitExamDto } from "./dto";

@ApiTags("assessment")
@Controller()
export class AssessmentController {
  constructor(private readonly service: AssessmentService) {}

  @Post("auth/login")
  login(@Body() dto: LoginDto) {
    return this.service.login(dto.username, dto.password);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get("dashboard/overview")
  overview() {
    return this.service.overview();
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get("courses")
  listCourses() {
    return this.service.listCourses();
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post("courses")
  createCourse(@Body() dto: CreateCourseDto) {
    return this.service.createCourse(dto);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get("questions")
  listQuestions() {
    return this.service.listQuestions();
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post("questions")
  createQuestion(@Body() dto: CreateQuestionDto) {
    return this.service.createQuestion(dto);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get("exam-plans")
  listExams() {
    return this.service.listExams();
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get("audit-logs")
  listAuditLogs() {
    return this.service.listAuditLogs();
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get("exam-plans/:id/entry")
  examEntry(@Param("id") id: string) {
    return this.service.examEntry(id);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post("exam-attempts/:id/submit")
  submitExam(@Param("id") id: string, @Body() dto: SubmitExamDto) {
    return this.service.submitExam(id, dto);
  }
}
