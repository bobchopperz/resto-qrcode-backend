import { IsString, IsOptional, MinLength } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  username?: string;

  @IsString()
  @IsOptional()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  role?: string;
}
