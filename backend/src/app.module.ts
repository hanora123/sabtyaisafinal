import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './database/prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { InventoriesModule } from './inventories/inventories.module';
import { PosModule } from './pos/pos.module';
import { SalesModule } from './sales/sales.module';
import { PurchasesModule } from './purchases/purchases.module';
import { AccountingModule } from './accounting/accounting.module';
import { ReportingModule } from './reporting/reporting.module';
import { NotificationsModule } from './notifications/notifications.module';
import { RealtimeModule } from './realtime/realtime.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { CustomersModule } from './customers/customers.module';
import { QuotesModule } from './quotes/quotes.module';
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    SuppliersModule,
    CustomersModule,
    QuotesModule,
    InventoriesModule,
    PosModule,
    SalesModule,
    PurchasesModule,
    AccountingModule,
    ReportingModule,
    NotificationsModule,
    RealtimeModule,
    AuditModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
