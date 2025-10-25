import { Controller, Post, Body, ValidationPipe, Get, Put, Param, Delete } from '@nestjs/common';
import { StokService } from './stok.service';
import { CreateStokDto } from './dto/create-stok.dto';
import { UpdateStokDto } from './dto/update-stok.dto';

@Controller('stok')
export class StokController {
  constructor(private readonly stokService: StokService) {}

  @Post()
  create(@Body(new ValidationPipe()) createStokDto: CreateStokDto) {
    return this.stokService.create(createStokDto);
  }

  @Get()
  findAll() {
    return this.stokService.findAll();
  }

  @Put(':id')
  update(@Param('id') id: string, @Body(new ValidationPipe()) updateStokDto: UpdateStokDto) {
    return this.stokService.update(id, updateStokDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.stokService.remove(id);
  }
}
