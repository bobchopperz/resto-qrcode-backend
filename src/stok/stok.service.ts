import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateStokDto } from './dto/create-stok.dto';
import { UpdateStokDto } from './dto/update-stok.dto';
import { Stok, StokDocument } from './stok.schema';
import { Menu, MenuDocument } from '../menu/menu.schema';

@Injectable()
export class StokService {
  constructor(
    @InjectModel(Stok.name) private stokModel: Model<StokDocument>,
    @InjectModel(Menu.name) private menuModel: Model<MenuDocument>,
  ) {}

  async create(createStokDto: CreateStokDto): Promise<StokDocument> {
    const { menu_id, kuantiti } = createStokDto;

    const menu = await this.menuModel.findById(menu_id);
    if (!menu) {
      throw new NotFoundException(`Menu dengan ID ${menu_id} tidak ditemukan.`);
    }

    // 1. Update kuantiti secara inkremental
    menu.stok += kuantiti;
    await menu.save();

    // 2. Buat riwayat stok baru
    const createdStok = new this.stokModel({
        ...createStokDto,
        tanggal_restok: new Date(createStokDto.tanggal_restok),
    });
    const savedStok = await createdStok.save();
    
    // 3. Update harga & modal dari data terbaru
    await this.updateMenuPriceAndModalFromLatestStok(menu_id);
    
    return savedStok;
  }

  async findAll(): Promise<StokDocument[]> {
    return this.stokModel.find().populate('menu_id').sort({ createdAt: -1 }).exec();
  }

  async update(id: string, updateStokDto: UpdateStokDto): Promise<StokDocument> {
    const stokToUpdate = await this.stokModel.findById(id);
    if (!stokToUpdate) {
      throw new NotFoundException(`Riwayat stok dengan ID ${id} tidak ditemukan.`);
    }

    const menu = await this.menuModel.findById(stokToUpdate.menu_id);
    if (!menu) {
      throw new NotFoundException(`Menu terkait dengan ID ${stokToUpdate.menu_id} tidak ditemukan.`);
    }

    // 1. Hitung selisih dan update kuantiti menu
    const kuantitiLama = stokToUpdate.kuantiti;
    const kuantitiBaru = updateStokDto.kuantiti !== undefined ? updateStokDto.kuantiti : kuantitiLama;
    const selisihKuantiti = kuantitiBaru - kuantitiLama;
    menu.stok += selisihKuantiti;
    await menu.save();

    // 2. Update data riwayat stok
    Object.assign(stokToUpdate, updateStokDto);
    const updatedStok = await stokToUpdate.save();

    // 3. Update harga & modal dari data terbaru
    await this.updateMenuPriceAndModalFromLatestStok(menu._id.toString());

    return updatedStok;
  }

  async remove(id: string): Promise<StokDocument> {
    const stokToDelete = await this.stokModel.findById(id);
    if (!stokToDelete) {
      throw new NotFoundException(`Riwayat stok dengan ID ${id} tidak ditemukan.`);
    }

    const menu = await this.menuModel.findById(stokToDelete.menu_id);
    if (menu) {
      // 1. Kurangi kuantiti di menu
      menu.stok -= stokToDelete.kuantiti;
      await menu.save();
    }

    // 2. Hapus riwayat stok
    const deletedStok = await this.stokModel.findByIdAndDelete(id);

    if (menu) {
      // 3. Update harga & modal dari data terbaru yang tersisa
      await this.updateMenuPriceAndModalFromLatestStok(menu._id.toString());
    }

    return deletedStok;
  }

  private async updateMenuPriceAndModalFromLatestStok(menuId: string): Promise<void> {
    const latestStokEntry = await this.stokModel
      .findOne({ menu_id: menuId })
      .sort({ tanggal_restok: -1 });

    const menu = await this.menuModel.findById(menuId);
    if (!menu) return;

    if (latestStokEntry) {
      menu.price = latestStokEntry.harga_jual;
      menu.modal = latestStokEntry.modal;
    } else {
      // Jika tidak ada riwayat stok tersisa, set ke 0 agar tidak ada data usang
      menu.price = 0;
      menu.modal = 0;
    }

    await menu.save();
  }
}
