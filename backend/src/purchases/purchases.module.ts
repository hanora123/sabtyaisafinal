import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma/prisma.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { AccountingModule } from '../accounting/accounting.module';
import { PurchasesController } from './purchases.controller';
import { PurchasesService } from './purchases.service';

@Module({
  imports: [PrismaModule, RealtimeModule, AccountingModule],
  controllers: [PurchasesController],
  providers: [PurchasesService],
})
export class PurchasesModule {}
