import { Module } from '@nestjs/common';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import { AccountingModule } from '../accounting/accounting.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [AccountingModule, RealtimeModule],
  controllers: [SalesController],
  providers: [SalesService],
  exports: [SalesService],
})
export class SalesModule {}
