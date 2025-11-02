import { IsString, IsNumber, IsOptional, IsArray, IsMongoId, ValidateIf } from 'class-validator';

export class UpdateMenuDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  price?: number;

  @IsNumber()
  @IsOptional()
  modal?: number;

  @IsNumber()
  @IsOptional()
  stok?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  // Izinkan string atau array, validasi lebih lanjut di service
  opsi?: string | string[]; 
}
