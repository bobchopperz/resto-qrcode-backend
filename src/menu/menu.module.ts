import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Menu } from './menu.entity';
import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Menu]),
  ],
  controllers: [MenuController], // Daftarkan controller di sini
  providers: [MenuService],     // Daftarkan service di sini
})
export class MenuModule {}
