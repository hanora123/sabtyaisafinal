import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma/prisma.service';
import { AccountingService } from '../accounting/accounting.service';
import { StockGateway } from '../realtime/gateways/stock.gateway';

@Injectable()
export class SalesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accountingService: AccountingService,
    private readonly stockGateway: StockGateway,
  ) {}

  async listSales(query: {
    customerId?: string;
    inventoryId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const where: Prisma.SaleWhereInput = {};

    if (query.customerId) where.customerId = query.customerId;
    if (query.inventoryId) where.inventoryId = query.inventoryId;
    if (query.status) where.status = query.status as any;

    if (query.startDate || query.endDate) {
      where.soldAt = {};
      if (query.startDate) where.soldAt.gte = new Date(query.startDate);
      if (query.endDate) where.soldAt.lte = new Date(query.endDate);
    }

    return this.prisma.sale.findMany({
      where,
      orderBy: { soldAt: 'desc' },
      include: {
        customer: { select: { id: true, name: true } },
        inventory: { select: { id: true, name: true } },
        cashier: { select: { id: true, fullName: true } },
      },
    });
  }

  async getSaleById(id: string) {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        payments: true,
        customer: true,
        inventory: true,
        cashier: { select: { id: true, fullName: true } },
        journalEntries: { include: { lines: { include: { account: true } } } },
      },
    });

    if (!sale) throw new NotFoundException('البيع غير موجود');
    return sale;
  }

  async voidSale(id: string, actorId: string, req: any) {
    return this.prisma
      .$transaction(async (tx) => {
        const sale = await tx.sale.findUnique({
          where: { id },
          include: { items: true },
        });

        if (!sale) throw new NotFoundException('البيع غير موجود');
        if (sale.status === 'VOIDED')
          throw new BadRequestException('البيع ملغي مسبقًا');
        if (
          sale.status === 'REFUNDED' ||
          sale.status === 'PARTIALLY_REFUNDED'
        ) {
          throw new BadRequestException(
            'لا يمكن إلغاء بيع تم استرجاعه، استخدم نظام المرتجعات',
          );
        }

        // 1. تحديث حالة البيع
        await tx.sale.update({
          where: { id },
          data: { status: 'VOIDED' },
        });

        // 2. إرجاع المخزون
        for (const item of sale.items) {
          await tx.stock.update({
            where: {
              productId_inventoryId: {
                productId: item.productId,
                inventoryId: sale.inventoryId,
              },
            },
            data: { onHandQty: { increment: item.quantity } },
          });

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              inventoryId: sale.inventoryId,
              movementType: 'RETURN_IN',
              quantity: item.quantity,
              unitCost: item.unitCost,
              referenceType: 'SALE_VOID',
              referenceId: sale.id,
              notes: 'إلغاء عملية بيع',
            },
          });
        }

        // 3. عكس القيد المحاسبي
        const entryNumber = `JE-VOID-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const originalEntries = await tx.journalEntry.findMany({
          where: { saleId: sale.id },
          include: { lines: true },
        });

        for (const oldEntry of originalEntries) {
          await tx.journalEntry.create({
            data: {
              entryNumber: `${entryNumber}-${oldEntry.id}`,
              sourceType: 'REFUND',
              sourceId: sale.id,
              description: `إلغاء قيد رقم ${oldEntry.entryNumber}`,
              createdById: actorId,
              saleId: sale.id,
              lines: {
                create: oldEntry.lines.map((l) => ({
                  accountId: l.accountId,
                  debit: l.credit, // عكس: الدائن يصبح مدين
                  credit: l.debit, // عكس: المدين يصبح دائن
                  memo: `إلغاء: ${l.memo}`,
                })),
              },
            },
          });
        }

        // 4. سجل التدقيق
        await tx.auditLog.create({
          data: {
            userId: actorId,
            action: 'SALE_VOIDED',
            entityType: 'SALE',
            entityId: sale.id,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            metadata: { saleNumber: sale.saleNumber },
          },
        });

        return { success: true };
      })
      .then((res) => {
        // إرسال تحديث للمخزون
        this.prisma.sale.findUnique({ where: { id } }).then((s) => {
          if (s) this.stockGateway.emitStockUpdated(s.inventoryId);
        });
        return res;
      });
  }
}
