import { Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class QuickAddProductDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @MinLength(3)
  sku!: string;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  supplierId?: string;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  costPrice!: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  sellingPrice!: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(0)
  minStockLevel?: number;

  @IsOptional()
  @IsString()
  inventoryId?: string;
}
