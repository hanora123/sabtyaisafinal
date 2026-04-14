import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma/prisma.module';
import { AccountingModule } from '../accounting/accounting.module';
import { ReportingController } from './reporting.controller';
import { ReportingService } from './reporting.service';

@Module({
  imports: [PrismaModule, AccountingModule],
  controllers: [ReportingController],
  providers: [ReportingService],
})
export class ReportingModule {}
