import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateStokDto } from './dto/create-stok.dto';
import { Stok, StokDocument } from './stok.schema';
import { Menu, MenuDocument } from '../menu/menu.schema';

@Injectable()
export class StokService {
  constructor(
    @InjectModel(Stok.name) private stokModel: Model<StokDocument>,
    @InjectModel(Menu.name) private menuModel: Model<MenuDocument>,
  ) {}

  async create(createStokDto: CreateStokDto): Promise<StokDocument> {
    const { menu_id, kuantiti, modal, harga_jual, tanggal_restok } = createStokDto;

    // 1. Cari menu berdasarkan ID
    const menu = await this.menuModel.findById(menu_id);
    if (!menu) {
      throw new NotFoundException(`Menu dengan ID ${menu_id} tidak ditemukan.`);
    }

    // 2. Update stok di koleksi menu
    menu.stok += kuantiti;
    menu.modal = modal; // Update modal juga jika berubah
    menu.price = harga_jual; // Update harga jual juga jika berubah
    await menu.save();

    // 3. Buat catatan history di koleksi stok
    const createdStok = new this.stokModel({
      menu_id: menu._id,
      kuantiti,
      modal,
      harga_jual,
      tanggal_restok: new Date(tanggal_restok),
    });

    return createdStok.save();
  }
}
