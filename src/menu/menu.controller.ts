import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Delete,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MenuService } from './menu.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { Express } from 'express';

@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Post()
  @UseInterceptors(FileInterceptor('imageFile'))
  create(
    @Body() createMenuDto: CreateMenuDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }), // 5MB
          new FileTypeValidator({ fileType: 'image/(jpeg|png)' }),
        ],
      }),
    )
    imageFile: Express.Multer.File,
  ) {
    const dtoWithNumbers = {
      ...createMenuDto,
      price: Number(createMenuDto.price),
      modal: Number(createMenuDto.modal),
    };
    return this.menuService.create(dtoWithNumbers, imageFile);
  }

  @Get()
  findAll() {
    return this.menuService.findAll();
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('imageFile'))
  update(
    @Param('id') id: string,
    @Body() updateMenuDto: UpdateMenuDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }), // 5MB
          new FileTypeValidator({ fileType: 'image/(jpeg|png)' }),
        ],
        fileIsRequired: false, // Make file optional
      }),
    )
    imageFile?: Express.Multer.File,
  ) {
    const dtoWithNumbers = { ...updateMenuDto };
    if (dtoWithNumbers.price) {
      dtoWithNumbers.price = Number(dtoWithNumbers.price);
    }
    if (dtoWithNumbers.modal) {
      dtoWithNumbers.modal = Number(dtoWithNumbers.modal);
    }
    return this.menuService.update(id, dtoWithNumbers, imageFile);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.menuService.remove(id);
  }
}
