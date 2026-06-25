import { IsArray, IsIn, IsNotEmpty, IsObject, IsOptional, IsString } from "class-validator";
import type { RoleCode } from "@assessment/shared";

export class LoginDto {
  @IsString()
  @IsIn(["platform_admin", "org_admin", "course_admin", "question_admin", "supervisor", "learner", "auditor"])
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
  score?: number;
}

export class SubmitExamDto {
  @IsObject()
  answers!: Record<string, string[]>;
}
