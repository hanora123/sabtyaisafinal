import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import bcrypt from 'bcrypt';
import { PrismaService } from '../database/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async listUsers() {
    return this.prisma.user.findMany({
      include: { userRoles: { include: { role: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { userRoles: { include: { role: true } } },
    });
    if (!user) throw new NotFoundException('المستخدم غير موجود');
    return user;
  }

  async createUser(dto: CreateUserDto) {
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { username: dto.username }] },
    });
    if (existing) throw new BadRequestException('المستخدم موجود مسبقًا');

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const roles = await this.prisma.role.findMany({
      where: { name: { in: dto.roles } },
    });

    return this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        fullName: dto.fullName,
        passwordHash,
        status: 'ACTIVE',
        userRoles: {
          create: roles.map((r) => ({ roleId: r.id })),
        },
      },
    });
  }

  async updateUser(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('المستخدم غير موجود');

    const data: any = {
      email: dto.email,
      username: dto.username,
      fullName: dto.fullName,
      status: dto.status,
    };

    if (dto.password) {
      data.passwordHash = await bcrypt.hash(dto.password, 12);
    }

    if (dto.roles) {
      const roles = await this.prisma.role.findMany({
        where: { name: { in: dto.roles } },
      });

      await this.prisma.userRole.deleteMany({ where: { userId: id } });
      data.userRoles = {
        create: roles.map((r) => ({ roleId: r.id })),
      };
    }

    return this.prisma.user.update({
      where: { id },
      data,
    });
  }
}
