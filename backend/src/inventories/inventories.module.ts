import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma/prisma.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { InventoriesController } from './inventories.controller';
import { InventoriesService } from './inventories.service';

@Module({
  imports: [PrismaModule, RealtimeModule],
  controllers: [InventoriesController],
  providers: [InventoriesService],
})
export class InventoriesModule {}
