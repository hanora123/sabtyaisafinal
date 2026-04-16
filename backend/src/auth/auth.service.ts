import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcrypt';

import type { Response, Request } from 'express';

import { PrismaService } from '../database/prisma/prisma.service';
import { type AppRole } from '../common/decorators/roles.decorator';
import type { AuthUser } from './auth-user.type';

import { SeedAdminDto } from './dto/seed-admin.dto';

type LoginResult = {
  user: AuthUser;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private getCookieOptions() {
    const isProd = this.configService.get<string>('NODE_ENV') === 'production';
    const maxAgeSeconds = Number(
      this.configService.get('JWT_EXPIRES_IN_SECONDS') ?? 60 * 60 * 24 * 7,
    );
    return {
      httpOnly: true,
      sameSite: isProd ? ('none' as const) : ('lax' as const),
      secure: isProd,
      path: '/',
      maxAge: maxAgeSeconds * 1000,
    };
  }

  private setAccessCookie(res: Response, token: string) {
    res.cookie('access_token', token, this.getCookieOptions());
  }

  private clearAccessCookie(res: Response) {
    res.clearCookie('access_token', { path: '/' });
  }

  async login(
    email: string,
    password: string,
    req: Request,
    res: Response,
  ): Promise<LoginResult> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { userRoles: { include: { role: true } } },
    });

    if (!user || user.status !== 'ACTIVE') {
      await this.prisma.auditLog.create({
        data: {
          userId: null,
          action: 'LOGIN_FAILED',
          entityType: 'AUTH',
          entityId: email,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          metadata: { email },
        },
      });
      throw new UnauthorizedException('بيانات الدخول غير صحيحة');
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      await this.prisma.auditLog.create({
        data: {
          userId: null,
          action: 'LOGIN_FAILED',
          entityType: 'AUTH',
          entityId: user.id,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          metadata: { email },
        },
      });
      throw new UnauthorizedException('بيانات الدخول غير صحيحة');
    }

    const roles = (user.userRoles?.map((ur) => ur.role.name) ??
      []) as AppRole[];

    const payload = { sub: user.id, email: user.email, roles };
    const token = this.jwtService.sign(payload);
    this.setAccessCookie(res, token);

    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN_SUCCESS',
        entityType: 'AUTH',
        entityId: user.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: { roles },
      },
    });

    return { user: { id: user.id, email: user.email, fullName: user.fullName, roles } };
  }

  async logout(req: Request, res: Response): Promise<void> {
    // request.user قد لا تكون موجودة إذا انقطع التوكن.
    const userId = (req as Request & { user?: AuthUser }).user?.id ?? null;
    this.clearAccessCookie(res);

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'LOGOUT',
        entityType: 'AUTH',
        entityId: userId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });
  }

  async me(req: Request & { user?: AuthUser }): Promise<AuthUser> {
    if (!req.user) throw new UnauthorizedException('غير مصرح');
    return req.user;
  }

  async seedDefaultAdmin(dto: SeedAdminDto, req: Request): Promise<void> {
    const userCount = await this.prisma.user.count();
    if (userCount > 0) {
      throw new UnauthorizedException('تمت تهيئة النظام مسبقًا');
    }

    const rolesData: { name: AppRole }[] = [
      { name: 'Admin' },
      { name: 'Cashier' },
      { name: 'Accountant' },
    ];
    await this.prisma.role.createMany({
      data: rolesData,
    });

    const adminPassword =
      dto.password ??
      this.configService.get<string>('SEED_ADMIN_PASSWORD') ??
      'admin123';
    const passwordHash = await bcrypt.hash(adminPassword, 12);

    const roles = await this.prisma.role.findMany({
      where: { name: { in: rolesData.map((r) => r.name) } },
    });
    const adminRole = roles.find((r) => r.name === 'Admin');
    if (!adminRole) throw new UnauthorizedException('فشل إنشاء دور Admin');

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        fullName: dto.fullName,
        passwordHash,
        userRoles: {
          create: [{ roleId: adminRole.id }],
        },
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'SEED_DEFAULT_ADMIN',
        entityType: 'AUTH',
        entityId: user.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });
  }

  async getRoles() {
    return this.prisma.role.findMany();
  }
}
