import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { OpsiMenuService } from './opsi-menu.service';
import { CreateOpsiMenuDto } from './dto/create-opsi-menu.dto';
import { UpdateOpsiMenuDto } from './dto/update-opsi-menu.dto';
import { JwtAuthGuard } from '../user/jwt-auth.guard';

@Controller('opsi-menu')
export class OpsiMenuController {
  constructor(private readonly opsiMenuService: OpsiMenuService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createOpsiMenuDto: CreateOpsiMenuDto) {
    return this.opsiMenuService.create(createOpsiMenuDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.opsiMenuService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.opsiMenuService.findById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() updateOpsiMenuDto: UpdateOpsiMenuDto) {
    return this.opsiMenuService.update(id, updateOpsiMenuDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.opsiMenuService.remove(id);
  }
}
