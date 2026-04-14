import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Controller('suppliers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  @Roles('Admin')
  create(@Body() dto: CreateSupplierDto) {
    return this.suppliersService.create(dto);
  }

  @Get()
  @Roles('Admin', 'Accountant')
  list(@Query('q') q?: string) {
    return this.suppliersService.list(q);
  }

  @Patch(':id')
  @Roles('Admin')
  update(@Param('id') id: string, @Body() dto: UpdateSupplierDto) {
    return this.suppliersService.update(id, dto);
  }
}
