import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Menu } from './menu.entity';

@Injectable()
export class MenuService {
  constructor(
    // Menyuntikkan repository dari entity Menu
    @InjectRepository(Menu)
    private menusRepository: Repository<Menu>,
  ) {}

  /**
   * Mengambil semua data menu dari database.
   * @returns {Promise<Menu[]>} Array dari semua menu.
   */
  findAll(): Promise<Menu[]> {
    return this.menusRepository.find();
  }
}
