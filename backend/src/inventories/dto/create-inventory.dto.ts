import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateInventoryDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  code!: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;
}
