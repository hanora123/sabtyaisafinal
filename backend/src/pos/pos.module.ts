import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma/prisma.module';
import { PosController } from './pos.controller';
import { PosService } from './pos.service';
import { ProductsModule } from '../products/products.module';
import { AccountingModule } from '../accounting/accounting.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [PrismaModule, ProductsModule, AccountingModule, RealtimeModule],
  controllers: [PosController],
  providers: [PosService],
})
export class PosModule {}
