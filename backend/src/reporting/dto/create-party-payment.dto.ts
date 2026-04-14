import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';

const METHODS = ['CASH', 'CARD', 'WALLET', 'BANK_TRANSFER', 'OTHER'] as const;

export class CreatePartyPaymentDto {
  @IsNumber()
  @Type(() => Number)
  @Min(0.01)
  amount!: number;

  @IsIn(METHODS as any)
  method!: (typeof METHODS)[number];

  @IsOptional()
  @IsString()
  referenceNo?: string;

  @IsOptional()
  @IsString()
  saleId?: string;

  @IsOptional()
  @IsString()
  purchaseId?: string;
}
