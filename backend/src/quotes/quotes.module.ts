import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma/prisma.module';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';

@Module({
  imports: [PrismaModule],
  controllers: [QuotesController],
  providers: [QuotesService],
})
export class QuotesModule {}
