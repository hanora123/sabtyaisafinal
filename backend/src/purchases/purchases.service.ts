import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request } from 'express';

import { PrismaService } from '../database/prisma/prisma.service';
import { StockGateway } from '../realtime/gateways/stock.gateway';
import { AccountingService } from '../accounting/accounting.service';

import { CreatePurchaseDto } from './dto/create-purchase.dto';

@Injectable()
export class PurchasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stockGateway: StockGateway,
    private readonly accountingService: AccountingService,
  ) {}

  async createPurchase(dto: CreatePurchaseDto, actorId: string, req: Request) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id: dto.supplierId },
    });
    if (!supplier) throw new NotFoundException('المورد غير موجود');

    return this.prisma
      .$transaction(async (tx) => {
        const inventory = await tx.inventory.findUnique({
          where: { id: dto.inventoryId },
        });
        if (!inventory || inventory.isActive === false)
          throw new BadRequestException('المخزون غير متاح');

        const productIds = dto.items.map((i) => i.productId);
        const products = await tx.product.findMany({
          where: { id: { in: productIds }, status: 'ACTIVE' },
          select: { id: true, name: true },
        });
        if (products.length !== productIds.length)
          throw new BadRequestException('بعض المنتجات غير موجودة أو غير فعالة');

        const subTotal = dto.items.reduce(
          (sum, it) => sum + it.unitCost * it.quantity,
          0,
        );
        const discountTotal = Math.max(0, dto.discountTotal ?? 0);
        const taxTotal = Math.max(0, dto.taxTotal ?? 0);
        const grandTotal = Math.max(0, subTotal - discountTotal + taxTotal);
        if (grandTotal <= 0) throw new BadRequestException('الإجمالي غير صالح');

        const purchaseNumber = `PUR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const purchase = await tx.purchase.create({
          data: {
            purchaseNumber,
            supplierId: dto.supplierId,
            inventoryId: dto.inventoryId,
            subTotal: new Prisma.Decimal(subTotal),
            discountTotal: new Prisma.Decimal(discountTotal),
            taxTotal: new Prisma.Decimal(taxTotal),
            grandTotal: new Prisma.Decimal(grandTotal),
          },
        });

        await tx.purchaseItem.createMany({
          data: dto.items.map((it) => ({
            purchaseId: purchase.id,
            productId: it.productId,
            quantity: it.quantity,
            unitCost: new Prisma.Decimal(it.unitCost),
            lineTotal: new Prisma.Decimal(it.unitCost * it.quantity),
          })),
        });

        // تحديث المخزون + حركة مخزون
        for (const it of dto.items) {
          await tx.stock.upsert({
            where: {
              productId_inventoryId: {
                productId: it.productId,
                inventoryId: dto.inventoryId,
              },
            },
            update: { onHandQty: { increment: it.quantity } },
            create: {
              productId: it.productId,
              inventoryId: dto.inventoryId,
              onHandQty: it.quantity,
              reservedQty: 0,
            },
          });

          await tx.stockMovement.create({
            data: {
              productId: it.productId,
              inventoryId: dto.inventoryId,
              movementType: 'PURCHASE_IN',
              quantity: it.quantity,
              unitCost: new Prisma.Decimal(it.unitCost),
              referenceType: 'PURCHASE',
              referenceId: purchase.id,
              notes: 'توريد',
            },
          });
        }

        // قيد التوريد (مدين مخزون / دائن مستحقات مورد)
        await this.accountingService.createPurchaseJournalEntry(
          { purchaseId: purchase.id, createdById: actorId, grandTotal },
          tx,
        );

        // دفعة اختيارية للمورد
        const paidNow = Math.max(0, dto.paidNow ?? 0);
        if (paidNow > 0) {
          if (paidNow - grandTotal > 0.01)
            throw new BadRequestException('قيمة المدفوع الآن أكبر من الإجمالي');
          const method = dto.paymentMethod ?? 'CASH';

          const payment = await tx.supplierPayment.create({
            data: {
              supplierId: dto.supplierId,
              purchaseId: purchase.id,
              method,
              amount: new Prisma.Decimal(paidNow),
              referenceNo: null,
            },
          });

          await this.accountingService.createSupplierPaymentJournalEntry(
            {
              supplierId: dto.supplierId,
              paymentId: payment.id,
              createdById: actorId,
              method,
              amount: paidNow,
            },
            tx,
          );
        }

        await tx.auditLog.create({
          data: {
            userId: actorId,
            action: 'PURCHASE_CREATED',
            entityType: 'PURCHASE',
            entityId: purchase.id,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            metadata: {
              purchaseNumber,
              grandTotal,
              supplierId: dto.supplierId,
            },
          },
        });

        return { purchaseId: purchase.id, purchaseNumber, grandTotal };
      })
      .then((result) => {
        this.stockGateway.emitStockUpdated(dto.inventoryId);
        return result;
      });
  }

  async listPurchases() {
    return this.prisma.purchase.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        supplier: { select: { name: true } },
        inventory: { select: { name: true } },
        items: {
          include: {
            product: { select: { name: true } },
          },
        },
      },
    });
  }
}
