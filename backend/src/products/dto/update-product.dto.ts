import { Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  sku?: string;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  supplierId?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  costPrice?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  sellingPrice?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(0)
  minStockLevel?: number;
}
