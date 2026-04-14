import {
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
import { SalesService } from './sales.service';

@Controller('sales')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get()
  @Roles('Admin', 'Accountant', 'Cashier')
  list(
    @Query('customerId') customerId?: string,
    @Query('inventoryId') inventoryId?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.salesService.listSales({
      customerId,
      inventoryId,
      status,
      startDate,
      endDate,
    });
  }

  @Get(':id')
  @Roles('Admin', 'Accountant', 'Cashier')
  getOne(@Param('id') id: string) {
    return this.salesService.getSaleById(id);
  }

  @Post(':id/void')
  @Roles('Admin')
  void(@Param('id') id: string, @Req() req: any) {
    return this.salesService.voidSale(id, req.user.id, req);
  }
}
