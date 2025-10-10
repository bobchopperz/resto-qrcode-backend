import { IsString, IsNumber, IsOptional } from 'class-validator';

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

  @IsString()
  @IsOptional()
  description?: string;
}
