import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ReportingService } from './reporting.service';
import { CreatePartyPaymentDto } from './dto/create-party-payment.dto';

@Controller('reporting')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportingController {
  constructor(private readonly reportingService: ReportingService) {}

  @Get('suppliers/:supplierId/statement')
  @Roles('Admin', 'Accountant')
  supplierStatement(@Param('supplierId') supplierId: string) {
    return this.reportingService.getSupplierStatement(supplierId);
  }

  @Get('customers/:customerId/statement')
  @Roles('Admin', 'Accountant')
  customerStatement(@Param('customerId') customerId: string) {
    return this.reportingService.getCustomerStatement(customerId);
  }

  @Post('suppliers/:supplierId/payments')
  @Roles('Admin', 'Accountant')
  createSupplierPayment(
    @Param('supplierId') supplierId: string,
    @Body() dto: CreatePartyPaymentDto,
    @Req() req: { user?: { id: string } },
  ) {
    return this.reportingService.recordSupplierPayment(
      supplierId,
      dto,
      req.user?.id ?? '',
    );
  }

  @Post('customers/:customerId/payments')
  @Roles('Admin', 'Accountant')
  createCustomerPayment(
    @Param('customerId') customerId: string,
    @Body() dto: CreatePartyPaymentDto,
    @Req() req: { user?: { id: string } },
  ) {
    return this.reportingService.recordCustomerPayment(
      customerId,
      dto,
      req.user?.id ?? '',
    );
  }

  @Get('sales')
  @Roles('Admin', 'Accountant')
  getSalesReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('inventoryId') inventoryId?: string,
  ) {
    return this.reportingService.getSalesReport({
      startDate,
      endDate,
      inventoryId,
    });
  }

  @Get('stock')
  @Roles('Admin', 'Accountant')
  getStockReport(@Query('inventoryId') inventoryId?: string) {
    return this.reportingService.getStockReport(inventoryId);
  }
}
