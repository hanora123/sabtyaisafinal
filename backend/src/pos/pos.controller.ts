import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

import { PosService } from './pos.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { QuickAddProductDto } from './dto/quick-add-product.dto';

@Controller('pos')
export class PosController {
  constructor(private readonly posService: PosService) {}

  @Get('products/search')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Cashier', 'Accountant')
  searchProducts(@Query('q') q?: string) {
    return this.posService.searchProducts(q);
  }

  @Post('sales')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Cashier')
  createSale(
    @Body() dto: CreateSaleDto,
    @Req() req: { user?: { id: string } },
  ) {
    return this.posService.createSale(dto, req.user?.id ?? '', req as any);
  }

  @Post('products/quick-add')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Cashier')
  quickAddProduct(
    @Body() dto: QuickAddProductDto,
    @Req() req: { user?: { id: string } },
  ) {
    return this.posService.quickAddProduct(dto, req.user?.id ?? '', req as any);
  }
}
