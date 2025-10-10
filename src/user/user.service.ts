import { Injectable, UnauthorizedException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtService } from '@nestjs/jwt';
import { LoginUserDto } from './dto/login-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    // Check if username already exists
    const existingUser = await this.findOneByUsername(createUserDto.username);
    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const newUser = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
      role: createUserDto.role || 'user', // Set default role if not provided
    });
    return newUser.save();
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().select('-password').exec(); // Exclude password from results
  }

  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).select('-password').exec();
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserDocument> {
    const existingUser = await this.userModel.findById(id).exec();
    if (!existingUser) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    // If username is being updated, check for conflict
    if (updateUserDto.username && updateUserDto.username !== existingUser.username) {
      const userWithNewUsername = await this.findOneByUsername(updateUserDto.username);
      if (userWithNewUsername) {
        throw new ConflictException('New username already taken');
      }
    }

    // Hash new password if provided
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    Object.assign(existingUser, updateUserDto);
    return existingUser.save();
  }

  async remove(id: string): Promise<void> {
    const result = await this.userModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
  }

  async login(loginUserDto: LoginUserDto): Promise<{ access_token: string }> {
    const user = await this.findOneByUsername(loginUserDto.username);

    if (!user) {
      throw new UnauthorizedException('Username atau password salah');
    }

    // Compare hashed password
    const isPasswordValid = await bcrypt.compare(loginUserDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Username atau password salah');
    }

    const payload = { sub: user._id, username: user.username, role: user.role };
    
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async findOneByUsername(username: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ username: username.toLowerCase() }).exec();
  }
}
