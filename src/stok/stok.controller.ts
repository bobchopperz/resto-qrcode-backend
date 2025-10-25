import { Controller, Post, Body, ValidationPipe } from '@nestjs/common';
import { StokService } from './stok.service';
import { CreateStokDto } from './dto/create-stok.dto';

@Controller('stok')
export class StokController {
  constructor(private readonly stokService: StokService) {}

  @Post()
  create(@Body(new ValidationPipe()) createStokDto: CreateStokDto) {
    return this.stokService.create(createStokDto);
  }
}
