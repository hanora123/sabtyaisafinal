import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma/prisma.service';
import type { CreateProductDto } from './dto/create-product.dto';
import type { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProductDto) {
    try {
      return await this.prisma.product.create({
        data: {
          name: dto.name,
          sku: dto.sku,
          barcode: dto.barcode ?? null,
          categoryId: dto.categoryId ?? null,
          supplierId: dto.supplierId ?? null,
          costPrice: new Prisma.Decimal(dto.costPrice),
          sellingPrice: new Prisma.Decimal(dto.sellingPrice),
          minStockLevel: dto.minStockLevel ?? 0,
          status: 'ACTIVE',
        },
      });
    } catch (e: any) {
      // Duplicate SKU / barcode etc.
      throw new BadRequestException(
        `تعذر إنشاء المنتج: ${e?.message ?? 'خطأ'}`,
      );
    }
  }

  async listActive() {
    return this.prisma.product.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        sku: true,
        barcode: true,
        costPrice: true,
        sellingPrice: true,
        minStockLevel: true,
        supplierId: true,
        supplier: { select: { id: true, name: true } },
      },
    });
  }

  async searchActive(q?: string) {
    const query = q?.trim();
    if (!query) return this.listActive();

    return this.prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { name: { contains: query } },
          { sku: { contains: query } },
          { barcode: { contains: query } },
        ],
      },
      take: 30,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        sku: true,
        barcode: true,
        costPrice: true,
        sellingPrice: true,
        minStockLevel: true,
        supplierId: true,
        supplier: { select: { id: true, name: true } },
      },
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('المنتج غير موجود');

    return this.prisma.product.update({
      where: { id },
      data: {
        name: dto.name,
        sku: dto.sku,
        barcode: dto.barcode,
        categoryId: dto.categoryId,
        supplierId: dto.supplierId,
        costPrice:
          dto.costPrice != null ? new Prisma.Decimal(dto.costPrice) : undefined,
        sellingPrice:
          dto.sellingPrice != null
            ? new Prisma.Decimal(dto.sellingPrice)
            : undefined,
        minStockLevel:
          dto.minStockLevel != null ? dto.minStockLevel : undefined,
      },
    });
  }

  async deactivate(id: string) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('المنتج غير موجود');
    return this.prisma.product.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });
  }
}
