import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../database/prisma/prisma.service';
import { CreateQuoteDto } from './dto/create-quote.dto';

@Injectable()
export class QuotesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateQuoteDto, actorId: string) {
    const subTotal = dto.items.reduce(
      (sum, it) => sum + it.unitPrice * it.quantity,
      0,
    );
    const discountTotal = Math.max(0, dto.discountTotal ?? 0);
    const taxTotal = Math.max(0, dto.taxTotal ?? 0);
    const grandTotal = Math.max(0, subTotal - discountTotal + taxTotal);

    if (grandTotal <= 0) throw new BadRequestException('الإجمالي غير صالح');

    const quoteNumber = `Q-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    return this.prisma.quote.create({
      data: {
        quoteNumber,
        customerId: dto.customerId ?? null,
        customerName: dto.customerName ?? null,
        notes: dto.notes ?? null,
        status: 'DRAFT',
        subTotal: new Prisma.Decimal(subTotal),
        discountTotal: new Prisma.Decimal(discountTotal),
        taxTotal: new Prisma.Decimal(taxTotal),
        grandTotal: new Prisma.Decimal(grandTotal),
        items: {
          create: dto.items.map((it) => ({
            productId: it.productId ?? null,
            description: it.description ?? null,
            quantity: it.quantity,
            unitPrice: new Prisma.Decimal(it.unitPrice),
            lineTotal: new Prisma.Decimal(it.unitPrice * it.quantity),
          })),
        },
      },
      include: { items: true },
    });
  }

  async list() {
    return this.prisma.quote.findMany({
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });
  }

  async getById(id: string) {
    return this.prisma.quote.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        customer: true,
      },
    });
  }
}
