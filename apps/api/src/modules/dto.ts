import { IsArray, IsNotEmpty, IsObject, IsOptional, IsString } from "class-validator";

export class LoginDto {
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

  @IsObject()
  answer!: Record<string, boolean>;
}

export class SubmitExamDto {
  @IsObject()
  answers!: Record<string, string[]>;
}
