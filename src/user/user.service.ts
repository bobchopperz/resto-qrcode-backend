import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtService } from '@nestjs/jwt';
import { LoginUserDto } from './dto/login-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    // PENTING: Tambahkan hashing password di sini sebelum menyimpan
    // const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const newUser = new this.userModel({
      ...createUserDto,
      // password: hashedPassword,
    });
    return newUser.save();
  }

  async login(loginUserDto: LoginUserDto): Promise<{ access_token: string }> {
    const user = await this.findOneByUsername(loginUserDto.username);

    // PENTING: Ganti perbandingan ini dengan bcrypt.compare saat hashing diimplementasikan
    if (user?.password !== loginUserDto.password) {
      throw new UnauthorizedException('Username atau password salah');
    }

    const payload = { sub: user._id, username: user.username };
    
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async findOneByUsername(username: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ username: username.toLowerCase() }).exec();
  }
}
