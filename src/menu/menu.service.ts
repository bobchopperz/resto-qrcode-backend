import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Menu, MenuDocument } from './menu.schema';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import * as sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs/promises';
import { OpsiMenu } from 'src/opsi-menu/opsi-menu.schema';

@Injectable()
export class MenuService {
  constructor(
    @InjectModel(Menu.name) private menuModel: Model<MenuDocument>,
  ) {}

  async create(
    createMenuDto: CreateMenuDto,
    imageFile: Express.Multer.File,
  ): Promise<Menu> {
    const imageFileName = `${Date.now()}.jpg`;
    const imagePath = path.join(
      process.cwd(),
      'public',
      'uploads',
      imageFileName,
    );

    await sharp(imageFile.buffer)
      .resize(440, 330)
      .jpeg({ quality: 90 })
      .toFile(imagePath);

    const imageUrl = `/uploads/${imageFileName}`;
    const newMenu = new this.menuModel({
      ...createMenuDto,
      imageUrl,
    });

    return newMenu.save();
  }

  async findAll(): Promise<Menu[]> {
    return this.menuModel.find().populate('opsi').exec();
  }

  async findAllForOrder(): Promise<any[]> {
    const menus = await this.menuModel
      .find()
      .select('-modal')
      .populate('opsi')
      .lean() // Convert to plain JavaScript objects
      .exec();

    // Manually remove 'modal' from the nested 'list_opsi'
    menus.forEach((menu) => {
      if (menu.opsi && Array.isArray(menu.opsi)) {
        menu.opsi.forEach((opsiItem: OpsiMenu) => {
          if (opsiItem.list_opsi && Array.isArray(opsiItem.list_opsi)) {
            opsiItem.list_opsi.forEach((listOpsiItem) => {
              delete (listOpsiItem as any).modal;
            });
          }
        });
      }
    });

    return menus;
  }

  async findById(id: string): Promise<MenuDocument> {
    return this.menuModel.findById(id).populate('opsi').exec();
  }

  async remove(id: string): Promise<MenuDocument> {
    const menu = await this.findById(id);
    if (!menu) {
      throw new NotFoundException(`Menu with ID "${id}" not found`);
    }

    if (menu.imageUrl) {
      const imagePath = path.join(process.cwd(), 'public', menu.imageUrl);
      try {
        await fs.unlink(imagePath);
      } catch (error) {
        console.warn(`Could not delete image file: ${imagePath}`, error.message);
      }
    }

    return this.menuModel.findByIdAndDelete(id).exec();
  }

  async update(
    id: string,
    updateMenuDto: UpdateMenuDto,
    imageFile?: Express.Multer.File,
  ): Promise<MenuDocument> {
    const existingMenu = await this.findById(id);
    if (!existingMenu) {
      throw new NotFoundException(`Menu with ID "${id}" not found`);
    }

    // --- PERBAIKAN DI SINI ---
    // Transformasi manual untuk field 'opsi'
    if (updateMenuDto.opsi === '') {
      updateMenuDto.opsi = [];
    } else if (updateMenuDto.opsi && !Array.isArray(updateMenuDto.opsi)) {
      // Jika ada tapi bukan array (misal, hanya satu item dipilih)
      updateMenuDto.opsi = [updateMenuDto.opsi];
    }
    // ------------------------

    // Handle image update if a new file is provided
    if (imageFile) {
      if (existingMenu.imageUrl) {
        const oldImagePath = path.join(
          process.cwd(),
          'public',
          existingMenu.imageUrl,
        );
        try {
          await fs.unlink(oldImagePath);
        } catch (error) {
          console.warn(
            `Could not delete old image file: ${oldImagePath}`,
            error.message,
          );
        }
      }

      const newImageFileName = `${Date.now()}.jpg`;
      const newImagePath = path.join(
        process.cwd(),
        'public',
        'uploads',
        newImageFileName,
      );

      await sharp(imageFile.buffer)
        .resize(440, 330)
        .jpeg({ quality: 90 })
        .toFile(newImagePath);

      existingMenu.imageUrl = `/uploads/${newImageFileName}`;
    }

    // Update text fields
    Object.assign(existingMenu, updateMenuDto);

    return existingMenu.save();
  }
}
