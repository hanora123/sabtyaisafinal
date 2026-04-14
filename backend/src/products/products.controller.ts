import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Roles('Admin')
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Get()
  @Roles('Admin', 'Cashier', 'Accountant')
  list() {
    return this.productsService.listActive();
  }

  @Get('search')
  @Roles('Admin', 'Cashier', 'Accountant')
  search(@Query('q') q?: string) {
    return this.productsService.searchActive(q);
  }

  @Patch(':id')
  @Roles('Admin')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('Admin')
  deactivate(@Param('id') id: string) {
    return this.productsService.deactivate(id);
  }
}
