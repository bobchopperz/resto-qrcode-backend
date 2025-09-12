import { Controller, Get } from '@nestjs/common';
import { MenuService } from './menu.service';
import { Menu } from './menu.entity';

@Controller('menu') // Menetapkan base path untuk semua endpoint di controller ini menjadi /menu
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get() // Menangani HTTP GET request ke /menu
  findAll(): Promise<Menu[]> {
    return this.menuService.findAll();
  }
}
