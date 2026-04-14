import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma/prisma.service';
import { AccountingService } from '../accounting/accounting.service';
import { Prisma } from '@prisma/client';
import { CreatePartyPaymentDto } from './dto/create-party-payment.dto';

@Injectable()
export class ReportingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accountingService: AccountingService,
  ) {}

  async getSupplierStatement(supplierId: string) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id: supplierId },
    });
    if (!supplier) throw new NotFoundException('المورد غير موجود');

    const purchases = await this.prisma.purchase.findMany({
      where: { supplierId },
      orderBy: { purchasedAt: 'asc' },
      select: {
        id: true,
        purchaseNumber: true,
        grandTotal: true,
        purchasedAt: true,
      },
    });

    const payments = await this.prisma.supplierPayment.findMany({
      where: { supplierId },
      orderBy: { paidAt: 'asc' },
      select: {
        id: true,
        amount: true,
        method: true,
        paidAt: true,
        purchaseId: true,
      },
    });

    const opening = Number(supplier.openingBalance ?? 0);
    const totalPurchases = purchases.reduce(
      (s, p) => s + Number(p.grandTotal),
      0,
    );
    const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0);
    const balance = opening + totalPurchases - totalPaid;

    return {
      supplier: { id: supplier.id, name: supplier.name },
      openingBalance: opening,
      totals: { purchases: totalPurchases, paid: totalPaid, balance },
      purchases,
      payments,
    };
  }

  async getCustomerStatement(customerId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer) throw new NotFoundException('العميل غير موجود');

    const sales = await this.prisma.sale.findMany({
      where: { customerId },
      orderBy: { soldAt: 'asc' },
      select: {
        id: true,
        saleNumber: true,
        grandTotal: true,
        soldAt: true,
      },
    });

    const payments = await this.prisma.customerPayment.findMany({
      where: { customerId },
      orderBy: { paidAt: 'asc' },
      select: {
        id: true,
        amount: true,
        method: true,
        paidAt: true,
        saleId: true,
      },
    });

    const opening = Number(customer.openingBalance ?? 0);
    const totalSales = sales.reduce((s, p) => s + Number(p.grandTotal), 0);
    const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0);
    const balance = opening + totalSales - totalPaid;

    return {
      customer: { id: customer.id, name: customer.name },
      openingBalance: opening,
      totals: { sales: totalSales, paid: totalPaid, balance },
      sales,
      payments,
    };
  }

  async recordSupplierPayment(
    supplierId: string,
    dto: CreatePartyPaymentDto,
    actorId: string,
  ) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id: supplierId },
    });
    if (!supplier) throw new NotFoundException('المورد غير موجود');

    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.supplierPayment.create({
        data: {
          supplierId,
          purchaseId: dto.purchaseId ?? null,
          method: dto.method,
          amount: new Prisma.Decimal(dto.amount),
          referenceNo: dto.referenceNo ?? null,
        },
      });

      await this.accountingService.createSupplierPaymentJournalEntry(
        {
          supplierId,
          paymentId: payment.id,
          createdById: actorId,
          method: dto.method as any,
          amount: dto.amount,
        },
        tx,
      );

      return payment;
    });
  }

  async recordCustomerPayment(
    customerId: string,
    dto: CreatePartyPaymentDto,
    actorId: string,
  ) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer) throw new NotFoundException('العميل غير موجود');

    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.customerPayment.create({
        data: {
          customerId,
          saleId: dto.saleId ?? null,
          method: dto.method,
          amount: new Prisma.Decimal(dto.amount),
          referenceNo: dto.referenceNo ?? null,
        },
      });

      await this.accountingService.createCustomerPaymentJournalEntry(
        {
          customerId,
          paymentId: payment.id,
          createdById: actorId,
          method: dto.method as any,
          amount: dto.amount,
        },
        tx,
      );

      return payment;
    });
  }

  async getSalesReport(query: {
    startDate?: string;
    endDate?: string;
    inventoryId?: string;
  }) {
    const where: Prisma.SaleWhereInput = { status: 'COMPLETED' };
    if (query.inventoryId) where.inventoryId = query.inventoryId;
    if (query.startDate || query.endDate) {
      where.soldAt = {};
      if (query.startDate) where.soldAt.gte = new Date(query.startDate);
      if (query.endDate) where.soldAt.lte = new Date(query.endDate);
    }

    const sales = await this.prisma.sale.findMany({
      where,
      include: { items: true },
    });

    const totalRevenue = sales.reduce((s, p) => s + Number(p.grandTotal), 0);
    const totalCost = sales.reduce((s, p) => {
      const itemsCost = p.items.reduce(
        (is, it) => is + Number(it.unitCost) * it.quantity,
        0,
      );
      return s + itemsCost;
    }, 0);

    return {
      count: sales.length,
      revenue: totalRevenue,
      cost: totalCost,
      profit: totalRevenue - totalCost,
    };
  }

  async getStockReport(inventoryId?: string) {
    const where: Prisma.StockWhereInput = {};
    if (inventoryId) where.inventoryId = inventoryId;

    const stocks = await this.prisma.stock.findMany({
      where,
      include: { product: true, inventory: true },
    });

    const report = stocks.map((s) => ({
      productId: s.productId,
      productName: s.product.name,
      sku: s.product.sku,
      inventoryName: s.inventory.name,
      onHand: s.onHandQty,
      reserved: s.reservedQty,
      available: s.onHandQty - s.reservedQty,
      unitCost: Number(s.product.costPrice),
      totalValue: Number(s.product.costPrice) * s.onHandQty,
    }));

    const totalValuation = report.reduce(
      (sum, item) => sum + item.totalValue,
      0,
    );

    return {
      totalValuation,
      items: report,
    };
  }
}
