import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Menu, MenuDocument } from './menu.schema';

@Injectable()
export class MenuService {
  constructor(
    @InjectModel(Menu.name) private menuModel: Model<MenuDocument>,
  ) {}

  /**
   * Mengambil semua data menu dari database.
   */
  async findAll(): Promise<Menu[]> {
    return this.menuModel.find().exec();
  }

  /**
   * Mencari satu menu berdasarkan ID-nya.
   */
  async findById(id: string): Promise<MenuDocument> {
    return this.menuModel.findById(id).exec();
  }
}