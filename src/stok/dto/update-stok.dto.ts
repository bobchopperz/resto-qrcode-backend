import { IsString, IsNumber, IsDateString, IsOptional } from 'class-validator';

export class UpdateStokDto {
  @IsString()
  @IsOptional()
  menu_id?: string;

  @IsNumber()
  @IsOptional()
  kuantiti?: number;

  @IsNumber()
  @IsOptional()
  modal?: number;

  @IsNumber()
  @IsOptional()
  harga_jual?: number;

  @IsDateString()
  @IsOptional()
  tanggal_restok?: string;
}
