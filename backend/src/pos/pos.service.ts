import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request } from 'express';

import { PrismaService } from '../database/prisma/prisma.service';
import { AccountingService } from '../accounting/accounting.service';
import { StockGateway } from '../realtime/gateways/stock.gateway';
import { ProductsService } from '../products/products.service';

import type { CreateSaleDto } from './dto/create-sale.dto';
import { type PaymentMethodInput } from './dto/create-sale.dto';
import type { QuickAddProductDto } from './dto/quick-add-product.dto';

type ReceiptItem = {
  productId: string;
  name: string;
  sku: string;
  barcode: string | null;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  lineTotal: number;
};

type SaleReceipt = {
  saleNumber: string;
  inventoryId: string;
  cashierId: string;
  subTotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  items: ReceiptItem[];
  payments: {
    method: PaymentMethodInput;
    amount: number;
    referenceNo?: string;
  }[];
};

@Injectable()
export class PosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productsService: ProductsService,
    private readonly accountingService: AccountingService,
    private readonly stockGateway: StockGateway,
  ) {}

  async searchProducts(q?: string) {
    return this.productsService.searchActive(q);
  }

  async quickAddProduct(
    dto: QuickAddProductDto,
    actorId: string,
    req: Request,
  ) {
    const inventoryId = dto.inventoryId;
    const existingByBarcode = dto.barcode
      ? await this.prisma.product.findUnique({
          where: { barcode: dto.barcode },
        })
      : null;
    const existingBySku = await this.prisma.product.findUnique({
      where: { sku: dto.sku },
    });
    const existing = existingByBarcode ?? existingBySku;

    if (existing) {
      if (existing.status !== 'ACTIVE') {
        await this.prisma.product.update({
          where: { id: existing.id },
          data: { status: 'ACTIVE' },
        });
      }

      await this.prisma.auditLog.create({
        data: {
          userId: actorId,
          action: 'QUICK_ADD_PRODUCT_FOUND',
          entityType: 'PRODUCT',
          entityId: existing.id,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          metadata: { sku: dto.sku, barcode: dto.barcode ?? null },
        },
      });

      const product = await this.prisma.product.findUnique({
        where: { id: existing.id },
        select: {
          id: true,
          name: true,
          sku: true,
          barcode: true,
          sellingPrice: true,
          costPrice: true,
          minStockLevel: true,
        },
      });

      if (inventoryId) {
        const stock = await this.prisma.stock.findUnique({
          where: {
            productId_inventoryId: { productId: existing.id, inventoryId },
          },
        });
        if (!stock) {
          await this.prisma.stock.create({
            data: {
              productId: existing.id,
              inventoryId,
              onHandQty: 0,
              reservedQty: 0,
            },
          });
        }
      }

      return product;
    }

    const created = await this.prisma.product.create({
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
      select: {
        id: true,
        name: true,
        sku: true,
        barcode: true,
        sellingPrice: true,
        costPrice: true,
        minStockLevel: true,
      },
    });

    if (inventoryId) {
      const stock = await this.prisma.stock.findUnique({
        where: {
          productId_inventoryId: { productId: created.id, inventoryId },
        },
      });
      if (!stock) {
        await this.prisma.stock.create({
          data: {
            productId: created.id,
            inventoryId,
            onHandQty: 0,
            reservedQty: 0,
          },
        });
      }
    }

    await this.prisma.auditLog.create({
      data: {
        userId: actorId,
        action: 'QUICK_ADD_PRODUCT_CREATED',
        entityType: 'PRODUCT',
        entityId: created.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: { sku: dto.sku, barcode: dto.barcode ?? null },
      },
    });

    return created;
  }

  async createSale(
    dto: CreateSaleDto,
    cashierId: string,
    req: Request,
  ): Promise<SaleReceipt> {
    // دمج عناصر السلة لو تكررت نفس productId
    const map = new Map<string, number>();
    for (const it of dto.items) {
      map.set(it.productId, (map.get(it.productId) ?? 0) + it.quantity);
    }

    const items = Array.from(map.entries()).map(([productId, quantity]) => ({
      productId,
      quantity,
    }));

    const receipt = await this.prisma.$transaction(async (tx) => {
      const inventory = await tx.inventory.findUnique({
        where: { id: dto.inventoryId },
        select: { id: true, isActive: true },
      });
      if (!inventory || inventory.isActive === false)
        throw new BadRequestException('المخزون غير متاح');

      if (dto.customerId) {
        const customer = await tx.customer.findUnique({
          where: { id: dto.customerId },
        });
        if (!customer) throw new BadRequestException('العميل غير موجود');
      }

      const productIds = items.map((x) => x.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
        select: {
          id: true,
          name: true,
          sku: true,
          barcode: true,
          status: true,
          sellingPrice: true,
          costPrice: true,
          minStockLevel: true,
        },
      });

      if (products.length !== productIds.length)
        throw new BadRequestException('بعض المنتجات غير موجودة');
      const byId = new Map(products.map((p) => [p.id, p]));

      for (const p of products) {
        if (p.status !== 'ACTIVE')
          throw new BadRequestException('منتج غير فعال في السلة');
      }

      const subTotal = items.reduce((sum, it) => {
        const p = byId.get(it.productId)!;
        return sum + Number(p.sellingPrice) * it.quantity;
      }, 0);

      const discountMode = dto.discountMode ?? null;
      const discountValue = dto.discountValue ?? 0;
      let discountTotal = 0;
      if (discountMode === 'fixed') {
        discountTotal = Math.min(subTotal, Math.max(0, discountValue));
      } else if (discountMode === 'percent') {
        discountTotal = subTotal * (Math.max(0, discountValue) / 100);
      }

      const taxTotal = dto.taxTotal ? Math.max(0, dto.taxTotal) : 0;
      const grandTotal = Math.max(0, subTotal - discountTotal + taxTotal);

      if (grandTotal <= 0)
        throw new BadRequestException('الإجمالي يجب أن يكون أكبر من صفر');

      if (!dto.payments || dto.payments.length === 0)
        throw new BadRequestException('يجب تحديد طرق الدفع');

      const paymentsTotal = dto.payments.reduce((sum, p) => sum + p.amount, 0);
      const diff = Math.abs(paymentsTotal - grandTotal);
      if (diff > 0.01) {
        throw new BadRequestException(
          'مجموع المدفوعات لا يطابق الإجمالي النهائي',
        );
      }

      const saleNumber = `SALE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const sale = await tx.sale.create({
        data: {
          saleNumber,
          inventoryId: dto.inventoryId,
          cashierId,
          customerId: dto.customerId ?? null,
          subTotal: new Prisma.Decimal(subTotal),
          discountTotal: new Prisma.Decimal(discountTotal),
          taxTotal: new Prisma.Decimal(taxTotal),
          grandTotal: new Prisma.Decimal(grandTotal),
          status: 'COMPLETED',
        },
      });

      // تجهيز قيود السلة (SaleItems)
      const receiptItems: ReceiptItem[] = [];
      const saleItemData = items.map((it) => {
        const p = byId.get(it.productId)!;
        const unitPrice = Number(p.sellingPrice);
        const unitCost = Number(p.costPrice);
        const lineSubtotal = unitPrice * it.quantity;
        const lineDiscount =
          subTotal > 0 ? (discountTotal * lineSubtotal) / subTotal : 0;
        const lineTotal = lineSubtotal - lineDiscount;

        receiptItems.push({
          productId: p.id,
          name: p.name,
          sku: p.sku,
          barcode: p.barcode,
          quantity: it.quantity,
          unitPrice,
          unitCost,
          lineTotal,
        });

        return {
          saleId: sale.id,
          productId: p.id,
          quantity: it.quantity,
          unitPrice: new Prisma.Decimal(unitPrice),
          unitCost: new Prisma.Decimal(unitCost),
          discountAmount: new Prisma.Decimal(lineDiscount),
          lineTotal: new Prisma.Decimal(lineTotal),
        };
      });

      await tx.saleItem.createMany({ data: saleItemData });

      // المدفوعات
      await tx.payment.createMany({
        data: dto.payments.map((p) => ({
          saleId: sale.id,
          method: p.method,
          amount: new Prisma.Decimal(p.amount),
          referenceNo: p.referenceNo ?? null,
        })),
      });

      if (dto.customerId) {
        await tx.customerPayment.createMany({
          data: dto.payments.map((p) => ({
            customerId: dto.customerId as string,
            saleId: sale.id,
            method: p.method,
            amount: new Prisma.Decimal(p.amount),
            referenceNo: p.referenceNo ?? null,
          })),
        });
      }

      // تحديث المخزون + StockMovement
      const costTotal = items.reduce((sum, it) => {
        const p = byId.get(it.productId)!;
        return sum + Number(p.costPrice) * it.quantity;
      }, 0);

      for (const it of items) {
        const p = byId.get(it.productId)!;

        const stock = await tx.stock.findUnique({
          where: {
            productId_inventoryId: {
              productId: it.productId,
              inventoryId: dto.inventoryId,
            },
          },
        });
        if (!stock)
          throw new BadRequestException(
            'لا توجد سجلات مخزون كافية لهذا المنتج',
          );

        const available = stock.onHandQty - stock.reservedQty;
        if (available < it.quantity) {
          throw new BadRequestException(`الكمية غير كافية للمنتج "${p.name}"`);
        }

        await tx.stock.update({
          where: {
            productId_inventoryId: {
              productId: it.productId,
              inventoryId: dto.inventoryId,
            },
          },
          data: { onHandQty: { decrement: it.quantity } },
        });

        await tx.stockMovement.create({
          data: {
            productId: it.productId,
            inventoryId: dto.inventoryId,
            movementType: 'SALE_OUT',
            quantity: it.quantity,
            unitCost: new Prisma.Decimal(Number(p.costPrice)),
            referenceType: 'SALE',
            referenceId: sale.id,
            notes: 'نقطة بيع',
          },
        });

        const stockAfter = await tx.stock.findUnique({
          where: {
            productId_inventoryId: {
              productId: it.productId,
              inventoryId: dto.inventoryId,
            },
          },
        });
        const onHandQty = stockAfter?.onHandQty ?? 0;

        if (
          p.minStockLevel != null &&
          p.minStockLevel > 0 &&
          onHandQty < p.minStockLevel
        ) {
          await tx.notification.create({
            data: {
              type: 'LOW_STOCK',
              title: 'تنبيه نقص المخزون',
              message: `المنتج "${p.name}" وصل إلى مستوى أقل من الحد في المخزون.`,
              isRead: false,
              targetUserId: null,
              metadata: { productId: p.id, inventoryId: dto.inventoryId },
            },
          });
        }
      }

      // قيود محاسبية (قيد مزدوج Sale)
      await this.accountingService.createSaleJournalEntry(
        {
          saleId: sale.id,
          cashierId,
          payments: dto.payments.map((p) => ({
            method: p.method,
            amount: p.amount,
          })),
          grandTotal,
          costTotal,
        },
        tx,
      );

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: cashierId,
          action: 'CHECKOUT_COMPLETED',
          entityType: 'SALE',
          entityId: sale.id,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          metadata: {
            saleNumber,
            grandTotal,
            items: items.map((x) => ({
              productId: x.productId,
              quantity: x.quantity,
            })),
          },
        },
      });

      return {
        saleNumber,
        inventoryId: dto.inventoryId,
        cashierId,
        subTotal,
        discountTotal,
        taxTotal,
        grandTotal,
        items: receiptItems,
        payments: dto.payments,
      } satisfies SaleReceipt;
    });

    this.stockGateway.emitStockUpdated(dto.inventoryId);
    return receipt;
  }
}
