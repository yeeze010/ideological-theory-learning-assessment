import { IsArray, IsIn, IsInt, IsISO8601, IsNotEmpty, IsObject, IsOptional, IsString, Min } from "class-validator";
import { ROLE_CODES, type RoleCode } from "@assessment/shared";

export class LoginDto {
  @IsString()
  @IsIn(ROLE_CODES)
  role!: RoleCode;

  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  category!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  requiredMinutes?: number;
}

export class CreateQuestionDto {
  @IsString()
  @IsNotEmpty()
  stem!: string;

  @IsString()
  @IsNotEmpty()
  bankName!: string;

  @IsArray()
  options!: string[];

  @IsArray()
  answer!: string[];

  @IsOptional()
  @IsInt()
  @Min(1)
  score?: number;
}

export class CreateExamPlanDto {
  @IsString()
  @IsNotEmpty()
  courseId!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsArray()
  @IsString({ each: true })
  questionIds!: string[];

  @IsInt()
  @Min(1)
  durationMinutes!: number;

  @IsInt()
  @Min(0)
  passScore!: number;

  @IsISO8601()
  startAt!: string;

  @IsISO8601()
  endAt!: string;
}

export class CreateInterventionDto {
  @IsString()
  @IsNotEmpty()
  learnerId!: string;

  @IsOptional()
  @IsString()
  courseId?: string;

  @IsOptional()
  @IsString()
  sourceAttemptId?: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  knowledgePoint!: string;

  @IsString()
  @IsNotEmpty()
  reason!: string;

  @IsIn(["low", "medium", "high"])
  priority!: "low" | "medium" | "high";
}

export class SubmitExamDto {
  @IsObject()
  answers!: Record<string, string[]>;
}
