import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class QuoteItemDto {
  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Type(() => Number)
  @Min(1)
  quantity!: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  unitPrice!: number;
}

export class CreateQuoteDto {
  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  customerName?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => QuoteItemDto)
  items!: QuoteItemDto[];

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
}
