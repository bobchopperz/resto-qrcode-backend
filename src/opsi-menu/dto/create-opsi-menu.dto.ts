import { IsString, IsArray, ArrayNotEmpty } from 'class-validator';

export class CreateOpsiMenuDto {
  @IsString()
  readonly nama_opsi: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  readonly list_opsi: string[];
}
