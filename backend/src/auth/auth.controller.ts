import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SeedAdminDto } from './dto/seed-admin.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthUser } from './auth-user.type';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.login(dto.email, dto.password, req, res);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(req, res);
    return { ok: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: Request & { user?: AuthUser }) {
    return this.authService.me(req);
  }

  @Post('seed-default-admin')
  async seedDefaultAdmin(@Body() dto: SeedAdminDto, @Req() req: Request) {
    await this.authService.seedDefaultAdmin(dto, req);
    return { ok: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('roles')
  async getRoles() {
    return this.authService.getRoles();
  }
}
