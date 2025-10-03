import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserDocument } from './user.schema';
import { LoginUserDto } from './dto/login-user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  create(@Body() createUserDto: CreateUserDto): Promise<UserDocument> {
    return this.userService.create(createUserDto);
  }

  @HttpCode(HttpStatus.OK) // Mengatur status sukses menjadi 200 OK
  @Post('login')
  login(@Body() loginUserDto: LoginUserDto): Promise<{ access_token: string }> {
    return this.userService.login(loginUserDto);
  }
}
