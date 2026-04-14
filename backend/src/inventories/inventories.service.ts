import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request } from 'express';

import { PrismaService } from '../database/prisma/prisma.service';
import { StockGateway } from '../realtime/gateways/stock.gateway';
import type { AdjustStockDto } from './dto/adjust-stock.dto';
import type { CreateInventoryDto } from './dto/create-inventory.dto';

@Injectable()
export class InventoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stockGateway: StockGateway,
  ) {}

  async list() {
    return this.prisma.inventory.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, code: true, isActive: true },
    });
  }

  async getStockForInventory(inventoryId: string) {
    return this.prisma.stock.findMany({
      where: { inventoryId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            barcode: true,
            minStockLevel: true,
            sellingPrice: true,
            costPrice: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async create(dto: CreateInventoryDto) {
    try {
      return await this.prisma.inventory.create({
        data: {
          name: dto.name,
          code: dto.code,
          isActive: dto.isActive ?? true,
        },
      });
    } catch (e: any) {
      throw new BadRequestException(
        `تعذر إنشاء المخزون: ${e?.message ?? 'خطأ'}`,
      );
    }
  }

  async seedDefaultInventories(req: Request) {
    // لا نُجبر على عدم وجود مخازن أخرى، فقط نتأكد من وجود الأساسية.
    const base = [
      { name: 'المستودع', code: 'WAREHOUSE' },
      { name: 'الفرع A', code: 'STORE_A' },
    ];

    for (const inv of base) {
      await this.prisma.inventory.upsert({
        where: { code: inv.code },
        update: {},
        create: inv,
      });
    }

    await this.prisma.auditLog.create({
      data: {
        userId: null,
        action: 'SEED_DEFAULT_INVENTORIES',
        entityType: 'INVENTORIES',
        entityId: null,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });
  }

  async addStock(
    inventoryId: string,
    dto: AdjustStockDto,
    actorId: string,
    req: Request,
  ) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      select: {
        id: true,
        status: true,
        costPrice: true,
        minStockLevel: true,
        name: true,
      },
    });
    if (!product || product.status !== 'ACTIVE') {
      throw new NotFoundException('المنتج غير موجود أو غير فعال');
    }

    const unitCost = dto.unitCost ?? Number(product.costPrice);
    const unitCostDecimal = new Prisma.Decimal(unitCost);

    await this.prisma.$transaction(async (tx) => {
      await tx.stock.upsert({
        where: {
          productId_inventoryId: { productId: dto.productId, inventoryId },
        },
        update: {
          onHandQty: { increment: dto.quantity },
        },
        create: {
          productId: dto.productId,
          inventoryId,
          onHandQty: dto.quantity,
          reservedQty: 0,
        },
      });

      await tx.stockMovement.create({
        data: {
          productId: dto.productId,
          inventoryId,
          movementType: 'ADJUST_IN',
          quantity: dto.quantity,
          unitCost: unitCostDecimal,
          referenceType: 'MANUAL',
          referenceId: null,
          notes: `إضافة مخزون بواسطة المستخدم`,
        },
      });

      // Low stock check after update
      const stock = await tx.stock.findUnique({
        where: {
          productId_inventoryId: { productId: dto.productId, inventoryId },
        },
      });
      const onHandQty = stock?.onHandQty ?? 0;
      if (
        product.minStockLevel != null &&
        product.minStockLevel > 0 &&
        onHandQty < product.minStockLevel
      ) {
        await tx.notification.create({
          data: {
            type: 'LOW_STOCK',
            title: 'تنبيه نقص المخزون',
            message: `المنتج "${product.name}" في المخزون ${inventoryId} وصل إلى حد أقل من المستوى.`,
            isRead: false,
            targetUserId: null,
            metadata: { productId: product.id, inventoryId },
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: actorId,
          action: 'STOCK_ADD',
          entityType: 'STOCK',
          entityId: `${inventoryId}:${dto.productId}`,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          metadata: { quantity: dto.quantity },
        },
      });
    });

    this.stockGateway.emitStockUpdated(inventoryId);
  }

  async removeStock(
    inventoryId: string,
    dto: AdjustStockDto,
    actorId: string,
    req: Request,
  ) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      select: {
        id: true,
        status: true,
        costPrice: true,
        minStockLevel: true,
        name: true,
      },
    });
    if (!product || product.status !== 'ACTIVE') {
      throw new NotFoundException('المنتج غير موجود أو غير فعال');
    }

    const unitCost = dto.unitCost ?? Number(product.costPrice);
    const unitCostDecimal = new Prisma.Decimal(unitCost);

    await this.prisma.$transaction(async (tx) => {
      const stock = await tx.stock.findUnique({
        where: {
          productId_inventoryId: { productId: dto.productId, inventoryId },
        },
      });

      if (!stock)
        throw new BadRequestException(
          'لا توجد سجلات مخزون لهذا المنتج في هذا المخزون',
        );
      const available = stock.onHandQty - stock.reservedQty;
      if (available < dto.quantity) {
        throw new BadRequestException('لا يمكن إزالة كمية أكبر من المتاح');
      }

      await tx.stock.update({
        where: {
          productId_inventoryId: { productId: dto.productId, inventoryId },
        },
        data: { onHandQty: { decrement: dto.quantity } },
      });

      await tx.stockMovement.create({
        data: {
          productId: dto.productId,
          inventoryId,
          movementType: 'ADJUST_OUT',
          quantity: dto.quantity,
          unitCost: unitCostDecimal,
          referenceType: 'MANUAL',
          referenceId: null,
          notes: `إزالة مخزون بواسطة المستخدم`,
        },
      });

      const stockAfter = await tx.stock.findUnique({
        where: {
          productId_inventoryId: { productId: dto.productId, inventoryId },
        },
      });
      const onHandQty = stockAfter?.onHandQty ?? 0;
      if (
        product.minStockLevel != null &&
        product.minStockLevel > 0 &&
        onHandQty < product.minStockLevel
      ) {
        await tx.notification.create({
          data: {
            type: 'LOW_STOCK',
            title: 'تنبيه نقص المخزون',
            message: `المنتج "${product.name}" في المخزون ${inventoryId} وصل إلى حد أقل من المستوى.`,
            isRead: false,
            targetUserId: null,
            metadata: { productId: product.id, inventoryId },
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: actorId,
          action: 'STOCK_REMOVE',
          entityType: 'STOCK',
          entityId: `${inventoryId}:${dto.productId}`,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          metadata: { quantity: dto.quantity },
        },
      });
    });

    this.stockGateway.emitStockUpdated(inventoryId);
  }

  async transferStock(
    fromInventoryId: string,
    toInventoryId: string,
    dto: { productId: string; quantity: number; notes?: string },
    actorId: string,
    req: Request,
  ) {
    if (fromInventoryId === toInventoryId) {
      throw new BadRequestException('لا يمكن التحويل لنفس المخزن');
    }

    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });
    if (!product) throw new NotFoundException('المنتج غير موجود');

    await this.prisma.$transaction(async (tx) => {
      // 1. Check and decrement from source
      const fromStock = await tx.stock.findUnique({
        where: {
          productId_inventoryId: {
            productId: dto.productId,
            inventoryId: fromInventoryId,
          },
        },
      });

      if (!fromStock || fromStock.onHandQty < dto.quantity) {
        throw new BadRequestException('الكمية المتاحة غير كافية في مخزن المصدر');
      }

      await tx.stock.update({
        where: {
          productId_inventoryId: {
            productId: dto.productId,
            inventoryId: fromInventoryId,
          },
        },
        data: { onHandQty: { decrement: dto.quantity } },
      });

      // 2. Increment target
      await tx.stock.upsert({
        where: {
          productId_inventoryId: {
            productId: dto.productId,
            inventoryId: toInventoryId,
          },
        },
        update: { onHandQty: { increment: dto.quantity } },
        create: {
          productId: dto.productId,
          inventoryId: toInventoryId,
          onHandQty: dto.quantity,
          reservedQty: 0,
        },
      });

      // 3. Create movements
      await tx.stockMovement.createMany({
        data: [
          {
            productId: dto.productId,
            inventoryId: fromInventoryId,
            movementType: 'TRANSFER_OUT',
            quantity: dto.quantity,
            unitCost: product.costPrice,
            referenceType: 'TRANSFER',
            notes: `تحويل إلى ${toInventoryId}. ${dto.notes ?? ''}`,
          },
          {
            productId: dto.productId,
            inventoryId: toInventoryId,
            movementType: 'TRANSFER_IN',
            quantity: dto.quantity,
            unitCost: product.costPrice,
            referenceType: 'TRANSFER',
            notes: `تحويل من ${fromInventoryId}. ${dto.notes ?? ''}`,
          },
        ],
      });

      await tx.auditLog.create({
        data: {
          userId: actorId,
          action: 'STOCK_TRANSFER',
          entityType: 'STOCK',
          entityId: `${fromInventoryId}->${toInventoryId}:${dto.productId}`,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          metadata: {
            from: fromInventoryId,
            to: toInventoryId,
            quantity: dto.quantity,
          },
        },
      });
    });

    this.stockGateway.emitStockUpdated(fromInventoryId);
    this.stockGateway.emitStockUpdated(toInventoryId);
  }
}
