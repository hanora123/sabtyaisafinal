import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSupplierDto) {
    try {
      return await this.prisma.supplier.create({
        data: {
          name: dto.name,
          phone: dto.phone ?? null,
          email: dto.email ?? null,
          address: dto.address ?? null,
        },
      });
    } catch (e: any) {
      throw new BadRequestException(
        `تعذر إنشاء المورد: ${e?.message ?? 'خطأ'}`,
      );
    }
  }

  async list(q?: string) {
    const query = q?.trim();
    return this.prisma.supplier.findMany({
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

  async update(id: string, dto: UpdateSupplierDto) {
    const existing = await this.prisma.supplier.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('المورد غير موجود');

    return this.prisma.supplier.update({
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
