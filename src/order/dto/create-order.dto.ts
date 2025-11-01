import { IsString, IsNumber, IsArray, ValidateNested, IsObject, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class PilihanOpsiDto {
    [key: string]: string;
}

class OrderItemDto {
  readonly menu_id: string;
  readonly kuantiti: number;
  readonly sub_total: number;

  @IsObject()
  @IsOptional()
  readonly pilihan_opsi?: PilihanOpsiDto;
}

export class CreateOrderDto {
  readonly _id: string;
  readonly nama_pelanggan: string;
  readonly no_wa_pelanggan: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  readonly orders: OrderItemDto[];
  
  readonly total_kesuluruhan: number;
  readonly timestamp: { $date: string };
}
