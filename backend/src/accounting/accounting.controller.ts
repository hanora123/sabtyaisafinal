import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AccountingService } from './accounting.service';

@Controller('accounting')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  @Post('seed-default-accounts')
  @Roles('Admin')
  async seedDefaultAccounts() {
    await this.accountingService.ensureDefaultAccounts();
    return { ok: true };
  }

  @Get('accounts')
  @Roles('Admin', 'Accountant')
  listAccounts() {
    return this.accountingService.listAccounts();
  }

  @Get('journals')
  @Roles('Admin', 'Accountant')
  listJournals(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.accountingService.listJournalEntries({ startDate, endDate });
  }

  @Get('accounts/:id/ledger')
  @Roles('Admin', 'Accountant')
  getLedger(
    @Param('id') id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.accountingService.getAccountLedger(id, { startDate, endDate });
  }

  @Get('trial-balance')
  @Roles('Admin', 'Accountant')
  getTrialBalance() {
    return this.accountingService.getTrialBalance();
  }

  @Get('income-statement')
  @Roles('Admin', 'Accountant')
  getIncomeStatement(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.accountingService.getIncomeStatement({ startDate, endDate });
  }

  @Get('balance-sheet')
  @Roles('Admin', 'Accountant')
  getBalanceSheet(@Query('date') date?: string) {
    return this.accountingService.getBalanceSheet({ date });
  }

  @Get('suppliers/:id/statement')
  @Roles('Admin', 'Accountant')
  getSupplierStatement(@Param('id') id: string) {
    return this.accountingService.getSupplierStatement(id);
  }

  @Get('customers/:id/statement')
  @Roles('Admin', 'Accountant')
  getCustomerStatement(@Param('id') id: string) {
    return this.accountingService.getCustomerStatement(id);
  }

  @Post('expenses')
  @Roles('Admin', 'Accountant')
  createExpense(
    @Body() dto: { description: string; amount: number; category: string; paymentMethod: any },
    @Req() req: any,
  ) {
    return this.accountingService.createExpenseEntry({
      ...dto,
      createdById: req.user.id,
    });
  }

  @Post('manual-journal')
  @Roles('Admin', 'Accountant')
  createManualJournal(
    @Body() dto: { description: string; lines: any[] },
    @Req() req: any,
  ) {
    return this.accountingService.createManualJournalEntry({
      ...dto,
      createdById: req.user.id,
    });
  }

  @Get('vat-report')
  @Roles('Admin', 'Accountant')
  getVATReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.accountingService.getVATReport({ startDate, endDate });
  }
}
