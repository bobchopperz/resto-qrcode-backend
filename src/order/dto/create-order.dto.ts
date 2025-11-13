import {
  IsString,
  IsNumber,
  IsArray,
  ValidateNested,
  IsMongoId,
  Min,
  IsOptional,
  ArrayNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

// DTO untuk opsi yang dipilih oleh user
class OpsiTerpilihDto {
  @IsString()
  nama_opsi: string;

  @IsString()
  pilihan: string;
}

// DTO untuk setiap item yang dikirim dari frontend
class CreateOrderItemDto {
  @IsMongoId()
  menuId: string;

  @IsNumber()
  @Min(1)
  jumlah: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OpsiTerpilihDto)
  @IsOptional()
  opsi_terpilih?: OpsiTerpilihDto[];
}

// DTO utama yang diterima oleh controller
export class CreateOrderDto {
  @IsString()
  nama_pelanggan: string;

  @IsString()
  @IsOptional()
  no_wa_pelanggan?: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
