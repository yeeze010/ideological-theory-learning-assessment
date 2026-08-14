import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import { AuthGuard } from "./auth.guard";
import { AuthService } from "./auth.service";
import type { AuthenticatedUser } from "./auth.types";
import { LoginDto } from "./dto";

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.role, dto.username, dto.password);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get("me")
  me(@Req() request: AuthenticatedRequest) {
    const { tenantId: _tenantId, orgId: _orgId, tokenVersion: _tokenVersion, ...profile } = request.user;
    return profile;
  }
}
