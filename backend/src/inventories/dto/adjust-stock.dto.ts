import { Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class AdjustStockDto {
  @IsString()
  productId!: string;

  @IsInt()
  @Type(() => Number)
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  unitCost?: number;
}
