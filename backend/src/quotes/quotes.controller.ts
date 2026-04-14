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

import { QuotesService } from './quotes.service';
import { CreateQuoteDto } from './dto/create-quote.dto';

@Controller('quotes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Post()
  @Roles('Admin', 'Accountant')
  create(
    @Body() dto: CreateQuoteDto,
    @Req() req: Request & { user?: { id: string } },
  ) {
    return this.quotesService.create(dto, req.user?.id ?? '');
  }

  @Get()
  @Roles('Admin', 'Accountant')
  list() {
    return this.quotesService.list();
  }

  @Get(':id')
  @Roles('Admin', 'Accountant')
  get(@Param('id') id: string) {
    return this.quotesService.getById(id);
  }
}
