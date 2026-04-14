import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

const PAYMENT_METHODS = [
  'CASH',
  'CARD',
  'WALLET',
  'BANK_TRANSFER',
  'OTHER',
] as const;

export class PurchaseItemDto {
  @IsString()
  productId!: string;

  @IsInt()
  @Type(() => Number)
  @Min(1)
  quantity!: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  unitCost!: number;
}

export class CreatePurchaseDto {
  @IsString()
  supplierId!: string;

  @IsString()
  inventoryId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PurchaseItemDto)
  items!: PurchaseItemDto[];

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  discountTotal?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  taxTotal?: number;

  // دفعة اختيارية عند التوريد (جزئية أو كاملة)
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  paidNow?: number;

  @IsOptional()
  @IsIn(PAYMENT_METHODS as any)
  paymentMethod?: (typeof PAYMENT_METHODS)[number];
}
