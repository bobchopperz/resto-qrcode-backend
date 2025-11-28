import {Controller, Post, Body, ValidationPipe, Get, Put, Param, Delete, UseGuards} from '@nestjs/common';
import { StokService } from './stok.service';
import { CreateStokDto } from './dto/create-stok.dto';
import { UpdateStokDto } from './dto/update-stok.dto';
import { JwtAuthGuard } from "../user/jwt-auth.guard";

@Controller('stok')
export class StokController {
  constructor(private readonly stokService: StokService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body(new ValidationPipe()) createStokDto: CreateStokDto) {
    return this.stokService.create(createStokDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.stokService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body(new ValidationPipe()) updateStokDto: UpdateStokDto) {
    return this.stokService.update(id, updateStokDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.stokService.remove(id);
  }
}
