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
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @Roles('Admin')
  create(@Body() dto: CreateCustomerDto) {
    return this.customersService.create(dto);
  }

  @Get()
  @Roles('Admin', 'Accountant')
  list(@Query('q') q?: string) {
    return this.customersService.list(q);
  }

  @Patch(':id')
  @Roles('Admin')
  update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.customersService.update(id, dto);
  }
}
