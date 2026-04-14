import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

import { AdjustStockDto } from './dto/adjust-stock.dto';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { InventoriesService } from './inventories.service';

@Controller('inventories')
export class InventoriesController {
  constructor(private readonly inventoriesService: InventoriesService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Cashier', 'Accountant')
  list() {
    return this.inventoriesService.list();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  create(@Body() dto: CreateInventoryDto) {
    return this.inventoriesService.create(dto);
  }

  @Post('seed-default')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  seedDefault(@Req() req: Request) {
    return this.inventoriesService.seedDefaultInventories(req);
  }

  @Get(':inventoryId/stock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Cashier', 'Accountant')
  getStockForInventory(@Param('inventoryId') inventoryId: string) {
    return this.inventoriesService.getStockForInventory(inventoryId);
  }

  @Post(':inventoryId/stock/add')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Cashier')
  addStock(
    @Param('inventoryId') inventoryId: string,
    @Body() dto: AdjustStockDto,
    @Req() req: Request & { user?: { id: string } },
  ) {
    return this.inventoriesService.addStock(
      inventoryId,
      dto,
      req.user?.id ?? '',
      req,
    );
  }

  @Post(':inventoryId/stock/remove')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Cashier')
  removeStock(
    @Param('inventoryId') inventoryId: string,
    @Body() dto: AdjustStockDto,
    @Req() req: Request & { user?: { id: string } },
  ) {
    return this.inventoriesService.removeStock(
      inventoryId,
      dto,
      req.user?.id ?? '',
      req,
    );
  }

  @Post(':inventoryId/stock/transfer/:toInventoryId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Accountant')
  transferStock(
    @Param('inventoryId') inventoryId: string,
    @Param('toInventoryId') toInventoryId: string,
    @Body() dto: { productId: string; quantity: number; notes?: string },
    @Req() req: Request & { user?: { id: string } },
  ) {
    return this.inventoriesService.transferStock(
      inventoryId,
      toInventoryId,
      dto,
      req.user?.id ?? '',
      req,
    );
  }
}
