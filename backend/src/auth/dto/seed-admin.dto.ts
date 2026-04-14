import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class SeedAdminDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(3)
  username!: string;

  @IsString()
  @MinLength(3)
  fullName!: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}
