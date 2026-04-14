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
export type PaymentMethodInput = (typeof PAYMENT_METHODS)[number];

export class SaleItemDto {
  @IsString()
  productId!: string;

  @IsInt()
  @Type(() => Number)
  @Min(1)
  quantity!: number;
}

export class PaymentDto {
  @IsIn(PAYMENT_METHODS as any)
  method!: PaymentMethodInput;

  @IsNumber()
  @Type(() => Number)
  @Min(0.01)
  amount!: number;

  @IsOptional()
  @IsString()
  referenceNo?: string;
}

export class CreateSaleDto {
  @IsString()
  inventoryId!: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items!: SaleItemDto[];

  @IsOptional()
  @IsIn(['fixed', 'percent'] as const)
  discountMode?: 'fixed' | 'percent';

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  discountValue?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  taxTotal?: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PaymentDto)
  payments!: PaymentDto[];
}
