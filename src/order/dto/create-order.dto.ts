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

class OpsiTerpilihDto {
  @IsString()
  nama_opsi: string;

  @IsString()
  pilihan: string;
}

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

export class CreateOrderDto {
  @IsString()
  nama_pelanggan: string;

  @IsString()
  @IsOptional()
  no_wa_pelanggan?: string;

  @IsString()
  @IsOptional()
  nomor_meja?: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
