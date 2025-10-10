import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Menu, MenuDocument } from './menu.schema';
import { CreateMenuDto } from './dto/create-menu.dto';
import * as sharp from 'sharp';
import * as path from 'path';

@Injectable()
export class MenuService {
  constructor(
    @InjectModel(Menu.name) private menuModel: Model<MenuDocument>,
  ) {}

  async create(
    createMenuDto: CreateMenuDto,
    imageFile: Express.Multer.File,
  ): Promise<Menu> {
    // 1. Proses dan simpan gambar
    const imageFileName = `${Date.now()}.jpg`;
    const imagePath = path.join(
      __dirname,
      '..',
      '..',
      'public',
      'uploads',
      imageFileName,
    );

    await sharp(imageFile.buffer)
      .resize(440, 330)
      .jpeg({ quality: 90 })
      .toFile(imagePath);

    // 2. Buat entitas menu baru
    const imageUrl = `/uploads/${imageFileName}`;
    const newMenu = new this.menuModel({
      ...createMenuDto,
      imageUrl,
    });

    // 3. Simpan ke database
    return newMenu.save();
  }

  async findAll(): Promise<Menu[]> {
    return this.menuModel.find().exec();
  }

  async findById(id: string): Promise<MenuDocument> {
    return this.menuModel.findById(id).exec();
  }
}
