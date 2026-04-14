import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
})
export class StockGateway {
  @WebSocketServer()
  server!: Server;

  emitStockUpdated(inventoryId: string) {
    this.server?.emit('stock.updated', { inventoryId });
  }
}
