import { IsString, IsNumber, IsDateString, IsNotEmpty } from 'class-validator';

export class CreateStokDto {
  @IsString()
  @IsNotEmpty()
  menu_id: string;

  @IsNumber()
  kuantiti: number;

  @IsNumber()
  modal: number;

  @IsNumber()
  harga_jual: number;

  @IsDateString()
  tanggal_restok: string;
}
