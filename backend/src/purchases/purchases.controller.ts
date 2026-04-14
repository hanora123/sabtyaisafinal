import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

import { PurchasesService } from './purchases.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';

@Controller('purchases')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Post()
  @Roles('Admin', 'Accountant')
  createPurchase(
    @Body() dto: CreatePurchaseDto,
    @Req() req: Request & { user?: { id: string } },
  ) {
    return this.purchasesService.createPurchase(dto, req.user?.id ?? '', req);
  }

  @Get()
  @Roles('Admin', 'Accountant')
  listPurchases() {
    return this.purchasesService.listPurchases();
  }
}
