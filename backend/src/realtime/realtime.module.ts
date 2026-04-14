import { Module } from '@nestjs/common';
import { StockGateway } from './gateways/stock.gateway';

@Module({
  providers: [StockGateway],
  exports: [StockGateway],
})
export class RealtimeModule {}
