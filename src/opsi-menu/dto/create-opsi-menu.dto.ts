import {
  IsString,
  IsArray,
  ArrayNotEmpty,
  ValidateNested,
  IsNumberString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ListOpsiDto {
  @IsString()
  readonly pilihan: string;

  @IsNumberString()
  readonly modal: string;

  @IsNumberString()
  readonly harga_jual: string;
}

export class CreateOpsiMenuDto {
  @IsString()
  readonly nama_opsi: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ListOpsiDto)
  readonly list_opsi: ListOpsiDto[];
}
