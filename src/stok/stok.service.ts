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
    const { menu_id, kuantiti, modal, harga_jual, tanggal_restok } = createStokDto;

    const menu = await this.menuModel.findById(menu_id);
    if (!menu) {
      throw new NotFoundException(`Menu dengan ID ${menu_id} tidak ditemukan.`);
    }

    menu.stok += kuantiti;
    await menu.save();

    const createdStok = new this.stokModel({
      menu_id: menu._id,
      kuantiti,
      modal,
      harga_jual,
      tanggal_restok: new Date(tanggal_restok),
    });

    const savedStok = await createdStok.save();
    await this.updateMenuFromLatestStok(menu_id);
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

    const kuantitiLama = stokToUpdate.kuantiti;
    const kuantitiBaru = updateStokDto.kuantiti !== undefined ? updateStokDto.kuantiti : kuantitiLama;
    const selisihKuantiti = kuantitiBaru - kuantitiLama;

    menu.stok += selisihKuantiti;
    await menu.save();

    Object.assign(stokToUpdate, updateStokDto);
    const updatedStok = await stokToUpdate.save();

    await this.updateMenuFromLatestStok(menu._id.toString());

    return updatedStok;
  }

  async remove(id: string): Promise<StokDocument> {
    const stokToDelete = await this.stokModel.findById(id);
    if (!stokToDelete) {
      throw new NotFoundException(`Riwayat stok dengan ID ${id} tidak ditemukan.`);
    }

    const menu = await this.menuModel.findById(stokToDelete.menu_id);
    if (menu) {
      menu.stok -= stokToDelete.kuantiti;
      await menu.save();
    }

    const deletedStok = await this.stokModel.findByIdAndDelete(id);

    if (menu) {
      await this.updateMenuFromLatestStok(menu._id.toString());
    }

    return deletedStok;
  }

  private async updateMenuFromLatestStok(menuId: string): Promise<void> {
    const latestStokEntry = await this.stokModel
      .findOne({ menu_id: menuId })
      .sort({ tanggal_restok: -1 });

    const menu = await this.menuModel.findById(menuId);
    if (!menu) return; // Menu mungkin sudah terhapus, jadi hentikan

    if (latestStokEntry) {
      menu.price = latestStokEntry.harga_jual;
      menu.modal = latestStokEntry.modal;
    } else {
      // Jika tidak ada riwayat stok tersisa, mungkin kita set ke 0 atau biarkan
      // Untuk saat ini, kita biarkan saja agar tidak kehilangan data harga terakhir
    }

    await menu.save();
  }
}
