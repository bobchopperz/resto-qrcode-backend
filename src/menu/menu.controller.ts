import {
  Controller,
  Get,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MenuService } from './menu.service';
import { CreateMenuDto } from './dto/create-menu.dto';
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
    // When using multipart/form-data, numbers might be sent as strings.
    // We convert them back to numbers before passing to the service.
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
}
