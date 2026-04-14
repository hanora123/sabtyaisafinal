import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AuditService } from './audit.service';

@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles('Admin')
  list(
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('limit') limit?: string,
  ) {
    return this.auditService.listLogs({
      userId,
      action,
      limit: limit ? parseInt(limit) : 100,
    });
  }
}
