import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCustomerDto) {
    try {
      return await this.prisma.customer.create({
        data: {
          name: dto.name,
          phone: dto.phone ?? null,
          email: dto.email ?? null,
          address: dto.address ?? null,
        },
      });
    } catch (e: any) {
      throw new BadRequestException(
        `تعذر إنشاء العميل: ${e?.message ?? 'خطأ'}`,
      );
    }
  }

  async list(q?: string) {
    const query = q?.trim();
    return this.prisma.customer.findMany({
      where: query
        ? {
            OR: [
              { name: { contains: query } },
              { phone: { contains: query } },
              { email: { contains: query } },
            ],
          }
        : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, dto: UpdateCustomerDto) {
    const existing = await this.prisma.customer.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('العميل غير موجود');

    return this.prisma.customer.update({
      where: { id },
      data: {
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        address: dto.address,
      },
    });
  }
}
