import { IsString, IsNumber, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateMenuDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  price: number;

  @IsNumber()
  modal: number;

  @IsNumber()
  stok: number;

  @IsString()
  @IsOptional()
  description?: string;
}
