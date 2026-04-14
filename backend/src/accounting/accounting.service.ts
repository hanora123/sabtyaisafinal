import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type {
  PaymentMethod,
  JournalSourceType,
  AccountType,
} from '@prisma/client';

import { PrismaService } from '../database/prisma/prisma.service';

type SaleJournalInput = {
  saleId: string;
  cashierId: string;
  payments: { method: PaymentMethod; amount: number }[];
  grandTotal: number;
  costTotal: number;
};

@Injectable()
export class AccountingService {
  constructor(private readonly prisma: PrismaService) {}

  private defaultAccounts() {
    // الأكواد ثابتة لأننا سنستخدمها في قيود البيع.
    return [
      { code: 'CASH', name: 'نقدية', type: 'ASSET' as AccountType },
      { code: 'BANK', name: 'بنك/بطاقات', type: 'ASSET' as AccountType },
      { code: 'INVENTORY', name: 'المخزون', type: 'ASSET' as AccountType },
      {
        code: 'CUSTOMER_RECEIVABLE',
        name: 'ذمم العملاء',
        type: 'ASSET' as AccountType,
      },
      {
        code: 'SUPPLIER_PAYABLE',
        name: 'مستحقات الموردين',
        type: 'LIABILITY' as AccountType,
      },
      {
        code: 'REVENUE',
        name: 'إيراد المبيعات',
        type: 'REVENUE' as AccountType,
      },
      {
        code: 'COGS',
        name: 'تكلفة البضاعة المباعة',
        type: 'EXPENSE' as AccountType,
      },
    ];
  }

  async ensureDefaultAccounts(prismaClient: PrismaService | any = this.prisma) {
    const accounts = this.defaultAccounts();
    const created = await Promise.all(
      accounts.map((a) =>
        prismaClient.account.upsert({
          where: { code: a.code },
          update: {},
          create: { code: a.code, name: a.name, type: a.type, isActive: true },
        }),
      ),
    );

    const byCode = new Map(created.map((a) => [a.code, a]));
    return {
      cash: byCode.get('CASH')!,
      bank: byCode.get('BANK')!,
      inventory: byCode.get('INVENTORY')!,
      customerReceivable: byCode.get('CUSTOMER_RECEIVABLE')!,
      revenue: byCode.get('REVENUE')!,
      cogs: byCode.get('COGS')!,
      supplierPayable: byCode.get('SUPPLIER_PAYABLE')!,
    };
  }

  async createSaleJournalEntry(
    input: SaleJournalInput,
    prismaClient: PrismaService | any = this.prisma,
  ) {
    const { cash, bank, revenue, inventory, cogs } =
      await this.ensureDefaultAccounts(prismaClient);

    if (!input.grandTotal || input.grandTotal <= 0) {
      throw new BadRequestException('الإجمالي غير صالح');
    }

    const grandTotalDecimal = new Prisma.Decimal(input.grandTotal);
    const costTotalDecimal = new Prisma.Decimal(input.costTotal);

    const entryNumber = `JE-SALE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    return prismaClient.journalEntry.create({
      data: {
        entryNumber,
        sourceType: 'SALE' as JournalSourceType,
        sourceId: input.saleId,
        description: 'قيد بيع تلقائي',
        createdById: input.cashierId,
        saleId: input.saleId,
        lines: {
          create: [
            ...input.payments.map((p) => {
              const isCashPayment = p.method === 'CASH';
              const accountId = isCashPayment ? cash.id : bank.id;
              return {
                accountId,
                debit: new Prisma.Decimal(p.amount),
                credit: new Prisma.Decimal(0),
                memo: `مدين (${p.method})`,
              };
            }),
            // دائن: إيراد المبيعات
            {
              accountId: revenue.id,
              debit: new Prisma.Decimal(0),
              credit: grandTotalDecimal,
              memo: 'إيراد المبيعات',
            },
            // مدين: تكلفة البضاعة المباعة
            {
              accountId: cogs.id,
              debit: costTotalDecimal,
              credit: new Prisma.Decimal(0),
              memo: 'تكلفة البضاعة',
            },
            // دائن: المخزون
            {
              accountId: inventory.id,
              debit: new Prisma.Decimal(0),
              credit: costTotalDecimal,
              memo: 'نقص المخزون',
            },
          ],
        },
      },
    });
  }

  async createPurchaseJournalEntry(
    input: { purchaseId: string; createdById: string; grandTotal: number },
    prismaClient: PrismaService | any = this.prisma,
  ) {
    const { inventory, supplierPayable } =
      await this.ensureDefaultAccounts(prismaClient);
    const amount = new Prisma.Decimal(input.grandTotal);
    const entryNumber = `JE-PURCHASE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    return prismaClient.journalEntry.create({
      data: {
        entryNumber,
        sourceType: 'PURCHASE' as any,
        sourceId: input.purchaseId,
        description: 'قيد توريد تلقائي',
        createdById: input.createdById,
        purchaseId: input.purchaseId,
        lines: {
          create: [
            // مدين: المخزون
            {
              accountId: inventory.id,
              debit: amount,
              credit: new Prisma.Decimal(0),
              memo: 'توريد بضاعة',
            },
            // دائن: مستحقات الموردين
            {
              accountId: supplierPayable.id,
              debit: new Prisma.Decimal(0),
              credit: amount,
              memo: 'مستحقات مورد',
            },
          ],
        },
      },
    });
  }

  async createSupplierPaymentJournalEntry(
    input: {
      supplierId: string;
      paymentId: string;
      createdById: string;
      method: PaymentMethod;
      amount: number;
    },
    prismaClient: PrismaService | any = this.prisma,
  ) {
    const { cash, bank, supplierPayable } =
      await this.ensureDefaultAccounts(prismaClient);
    const amount = new Prisma.Decimal(input.amount);
    const entryNumber = `JE-SUPPAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const cashAccountId = input.method === 'CASH' ? cash.id : bank.id;

    return prismaClient.journalEntry.create({
      data: {
        entryNumber,
        sourceType: 'PAYMENT_OUT' as any,
        sourceId: input.paymentId,
        description: 'قيد سداد مورد',
        createdById: input.createdById,
        lines: {
          create: [
            // مدين: مستحقات المورد
            {
              accountId: supplierPayable.id,
              debit: amount,
              credit: new Prisma.Decimal(0),
              memo: 'سداد مورد',
            },
            // دائن: نقدية/بنك
            {
              accountId: cashAccountId,
              debit: new Prisma.Decimal(0),
              credit: amount,
              memo: 'خروج نقد/بنك',
            },
          ],
        },
      },
    });
  }

  async createCustomerPaymentJournalEntry(
    input: {
      customerId: string;
      paymentId: string;
      createdById: string;
      method: PaymentMethod;
      amount: number;
    },
    prismaClient: PrismaService | any = this.prisma,
  ) {
    const { cash, bank, customerReceivable } =
      await this.ensureDefaultAccounts(prismaClient);
    const amount = new Prisma.Decimal(input.amount);
    const entryNumber = `JE-CUSTPAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const cashAccountId = input.method === 'CASH' ? cash.id : bank.id;

    return prismaClient.journalEntry.create({
      data: {
        entryNumber,
        sourceType: 'PAYMENT_IN' as any,
        sourceId: input.paymentId,
        description: 'قيد تحصيل عميل',
        createdById: input.createdById,
        lines: {
          create: [
            // مدين: نقدية/بنك
            {
              accountId: cashAccountId,
              debit: amount,
              credit: new Prisma.Decimal(0),
              memo: 'تحصيل عميل',
            },
            // دائن: ذمم العملاء
            {
              accountId: customerReceivable.id,
              debit: new Prisma.Decimal(0),
              credit: amount,
              memo: 'تسوية ذمة عميل',
            },
          ],
        },
      },
    });
  }

  async listAccounts() {
    return this.prisma.account.findMany({
      orderBy: { code: 'asc' },
      include: { children: true },
    });
  }

  async listJournalEntries(query: { startDate?: string; endDate?: string }) {
    const where: any = {};
    if (query.startDate || query.endDate) {
      where.entryDate = {};
      if (query.startDate) where.entryDate.gte = new Date(query.startDate);
      if (query.endDate) where.entryDate.lte = new Date(query.endDate);
    }
    return this.prisma.journalEntry.findMany({
      where,
      orderBy: { entryDate: 'desc' },
      include: { lines: { include: { account: true } } },
    });
  }

  async getAccountLedger(
    accountId: string,
    query: { startDate?: string; endDate?: string },
  ) {
    const where: any = { accountId };
    if (query.startDate || query.endDate) {
      where.journalEntry = { entryDate: {} };
      if (query.startDate)
        where.journalEntry.entryDate.gte = new Date(query.startDate);
      if (query.endDate)
        where.journalEntry.entryDate.lte = new Date(query.endDate);
    }

    const lines = await this.prisma.journalEntryLine.findMany({
      where,
      orderBy: { journalEntry: { entryDate: 'asc' } },
      include: { journalEntry: true },
    });

    return lines;
  }

  async getTrialBalance() {
    const accounts = await this.prisma.account.findMany({
      include: {
        journalLines: true,
      },
    });

    const result = accounts.map((acc) => {
      const debit = acc.journalLines.reduce(
        (sum, l) => sum + Number(l.debit),
        0,
      );
      const credit = acc.journalLines.reduce(
        (sum, l) => sum + Number(l.credit),
        0,
      );
      return {
        id: acc.id,
        code: acc.code,
        name: acc.name,
        type: acc.type,
        debit,
        credit,
        balance: debit - credit,
      };
    });

    return result;
  }

  async getIncomeStatement(query: { startDate?: string; endDate?: string }) {
    const trialBalance = await this.getTrialBalance();
    
    // In a real P&L, we might want to filter journal lines by date first, 
    // but for simplicity we'll use the trial balance logic or similar.
    // Let's implement a date-filtered version for accuracy.
    const accounts = await this.prisma.account.findMany({
      where: { type: { in: ['REVENUE', 'EXPENSE'] } },
      include: {
        journalLines: {
          where: {
            journalEntry: {
              entryDate: {
                gte: query.startDate ? new Date(query.startDate) : undefined,
                lte: query.endDate ? new Date(query.endDate) : undefined,
              }
            }
          }
        }
      }
    });

    const revenueAccounts = accounts.filter(a => a.type === 'REVENUE').map(acc => {
      const credit = acc.journalLines.reduce((sum, l) => sum + Number(l.credit), 0);
      const debit = acc.journalLines.reduce((sum, l) => sum + Number(l.debit), 0);
      return { name: acc.name, amount: credit - debit };
    });

    const expenseAccounts = accounts.filter(a => a.type === 'EXPENSE').map(acc => {
      const debit = acc.journalLines.reduce((sum, l) => sum + Number(l.debit), 0);
      const credit = acc.journalLines.reduce((sum, l) => sum + Number(l.credit), 0);
      return { name: acc.name, amount: debit - credit };
    });

    const totalRevenue = revenueAccounts.reduce((sum, a) => sum + a.amount, 0);
    const totalExpenses = expenseAccounts.reduce((sum, a) => sum + a.amount, 0);

    return {
      revenue: revenueAccounts,
      expenses: expenseAccounts,
      totalRevenue,
      totalExpenses,
      netIncome: totalRevenue - totalExpenses,
    };
  }

  async getBalanceSheet(query: { date?: string }) {
    const asOfDate = query.date ? new Date(query.date) : new Date();

    const accounts = await this.prisma.account.findMany({
      where: { type: { in: ['ASSET', 'LIABILITY', 'EQUITY'] } },
      include: {
        journalLines: {
          where: {
            journalEntry: {
              entryDate: { lte: asOfDate }
            }
          }
        }
      }
    });

    // We also need to calculate Net Income up to this date to include in Equity
    const pnl = await this.getIncomeStatement({ endDate: asOfDate.toISOString() });

    const assets = accounts.filter(a => a.type === 'ASSET').map(acc => {
      const debit = acc.journalLines.reduce((sum, l) => sum + Number(l.debit), 0);
      const credit = acc.journalLines.reduce((sum, l) => sum + Number(l.credit), 0);
      return { name: acc.name, amount: debit - credit };
    });

    const liabilities = accounts.filter(a => a.type === 'LIABILITY').map(acc => {
      const credit = acc.journalLines.reduce((sum, l) => sum + Number(l.credit), 0);
      const debit = acc.journalLines.reduce((sum, l) => sum + Number(l.debit), 0);
      return { name: acc.name, amount: credit - debit };
    });

    const equity = accounts.filter(a => a.type === 'EQUITY').map(acc => {
      const credit = acc.journalLines.reduce((sum, l) => sum + Number(l.credit), 0);
      const debit = acc.journalLines.reduce((sum, l) => sum + Number(l.debit), 0);
      return { name: acc.name, amount: credit - debit };
    });

    // Add Net Income to Equity
    equity.push({ name: 'صافي الربح (الفترة الحالية)', amount: pnl.netIncome });

    const totalAssets = assets.reduce((sum, a) => sum + a.amount, 0);
    const totalLiabilities = liabilities.reduce((sum, a) => sum + a.amount, 0);
    const totalEquity = equity.reduce((sum, a) => sum + a.amount, 0);

    return {
      assets,
      liabilities,
      equity,
      totalAssets,
      totalLiabilities,
      totalEquity,
      totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
    };
  }

  async getSupplierStatement(supplierId: string) {
    const purchases = await this.prisma.purchase.findMany({
      where: { supplierId },
      orderBy: { createdAt: 'asc' },
    });

    const payments = await this.prisma.supplierPayment.findMany({
      where: { supplierId },
      orderBy: { createdAt: 'asc' },
    });

    // دمج وترتيب العمليات
    const statement = [
      ...purchases.map((p) => ({
        date: p.createdAt,
        type: 'PURCHASE',
        reference: p.purchaseNumber,
        amount: Number(p.grandTotal),
        impact: 'DEBT', // تزيد المديونية
      })),
      ...payments.map((p) => ({
        date: p.createdAt,
        type: 'PAYMENT',
        reference: p.referenceNo || 'سداد نقدي',
        amount: Number(p.amount),
        impact: 'CREDIT', // تقلل المديونية
      })),
    ].sort((a, b) => a.date.getTime() - b.date.getTime());

    let balance = 0;
    const rows = statement.map((row) => {
      if (row.impact === 'DEBT') balance += row.amount;
      else balance -= row.amount;
      return { ...row, balance };
    });

    return { rows, finalBalance: balance };
  }

  async getCustomerStatement(customerId: string) {
    const sales = await this.prisma.sale.findMany({
      where: { customerId },
      orderBy: { createdAt: 'asc' },
    });

    const payments = await this.prisma.customerPayment.findMany({
      where: { customerId },
      orderBy: { createdAt: 'asc' },
    });

    const statement = [
      ...sales.map((s) => ({
        date: s.createdAt,
        type: 'SALE',
        reference: s.invoiceNumber,
        amount: Number(s.grandTotal),
        impact: 'DEBT', // العميل مدين لنا
      })),
      ...payments.map((p) => ({
        date: p.createdAt,
        type: 'PAYMENT',
        reference: p.referenceNo || 'تحصيل نقدي',
        amount: Number(p.amount),
        impact: 'CREDIT', // العميل سدد
      })),
    ].sort((a, b) => a.date.getTime() - b.date.getTime());

    let balance = 0;
    const rows = statement.map((row) => {
      if (row.impact === 'DEBT') balance += row.amount;
      else balance -= row.amount;
      return { ...row, balance };
    });

    return { rows, finalBalance: balance };
  }

  async createExpenseEntry(
    input: { 
      description: string; 
      amount: number; 
      category: string; 
      paymentMethod: PaymentMethod;
      createdById: string;
    },
    prismaClient: PrismaService | any = this.prisma
  ) {
    const { cash, bank } = await this.ensureDefaultAccounts(prismaClient);
    
    // Create or find the specific expense account
    const expenseAccount = await prismaClient.account.upsert({
      where: { code: `EXP-${input.category.toUpperCase()}` },
      update: {},
      create: { 
        code: `EXP-${input.category.toUpperCase()}`, 
        name: `مصروف: ${input.category}`, 
        type: 'EXPENSE',
        isActive: true 
      },
    });

    const amount = new Prisma.Decimal(input.amount);
    const entryNumber = `JE-EXP-${Date.now()}`;
    const paymentAccountId = input.paymentMethod === 'CASH' ? cash.id : bank.id;

    return prismaClient.journalEntry.create({
      data: {
        entryNumber,
        sourceType: 'EXPENSE' as any,
        description: input.description,
        createdById: input.createdById,
        lines: {
          create: [
            { accountId: expenseAccount.id, debit: amount, credit: 0, memo: input.description },
            { accountId: paymentAccountId, debit: 0, credit: amount, memo: 'دفع مصروف' },
          ]
        }
      }
    });
  }

  async createManualJournalEntry(
    input: { 
      description: string; 
      lines: { accountId: string; debit: number; credit: number; memo?: string }[];
      createdById: string;
    },
    prismaClient: PrismaService | any = this.prisma
  ) {
    // Validate balance
    const totalDebit = input.lines.reduce((sum, l) => sum + l.debit, 0);
    const totalCredit = input.lines.reduce((sum, l) => sum + l.credit, 0);
    
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new BadRequestException('القيد غير متوازن (المدين لا يساوي الدائن)');
    }

    const entryNumber = `JE-MANUAL-${Date.now()}`;

    return prismaClient.journalEntry.create({
      data: {
        entryNumber,
        sourceType: 'MANUAL' as any,
        description: input.description,
        createdById: input.createdById,
        lines: {
          create: input.lines.map(l => ({
            accountId: l.accountId,
            debit: new Prisma.Decimal(l.debit),
            credit: new Prisma.Decimal(l.credit),
            memo: l.memo
          }))
        }
      }
    });
  }

  async getVATReport(query: { startDate?: string; endDate?: string }) {
    // Get VAT from Sales (Output VAT) and Purchases (Input VAT)
    const sales = await this.prisma.sale.findMany({
      where: {
        createdAt: {
          gte: query.startDate ? new Date(query.startDate) : undefined,
          lte: query.endDate ? new Date(query.endDate) : undefined,
        }
      },
      select: { taxTotal: true }
    });

    const purchases = await this.prisma.purchase.findMany({
      where: {
        createdAt: {
          gte: query.startDate ? new Date(query.startDate) : undefined,
          lte: query.endDate ? new Date(query.endDate) : undefined,
        }
      },
      select: { taxTotal: true }
    });

    const outputVat = sales.reduce((sum, s) => sum + Number(s.taxTotal), 0);
    const inputVat = purchases.reduce((sum, p) => sum + Number(p.taxTotal), 0);

    return {
      outputVat, // VAT on Sales
      inputVat,  // VAT on Purchases
      netVat: outputVat - inputVat // VAT to pay/claim
    };
  }
}
