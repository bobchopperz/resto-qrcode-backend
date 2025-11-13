import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateOpsiMenuDto } from './dto/create-opsi-menu.dto';
import { UpdateOpsiMenuDto } from './dto/update-opsi-menu.dto';
import { OpsiMenu, OpsiMenuDocument } from './opsi-menu.schema';

@Injectable()
export class OpsiMenuService {
  constructor(
    @InjectModel(OpsiMenu.name) private readonly opsiMenuModel: Model<OpsiMenuDocument>,
  ) {}

  async create(createOpsiMenuDto: CreateOpsiMenuDto): Promise<OpsiMenu> {
    const createdOpsiMenu = new this.opsiMenuModel(createOpsiMenuDto);
    return createdOpsiMenu.save();
  }

  async findAll(): Promise<OpsiMenu[]> {
    return this.opsiMenuModel.find().exec();
  }

  async findById(id: string): Promise<OpsiMenu> {
    return this.opsiMenuModel.findById(id).exec();
  }

  async update(id: string, updateOpsiMenuDto: UpdateOpsiMenuDto): Promise<OpsiMenu> {
    return this.opsiMenuModel.findByIdAndUpdate(id, updateOpsiMenuDto, { new: true }).exec();
  }

  async remove(id: string): Promise<OpsiMenu> {
    return this.opsiMenuModel.findByIdAndDelete(id).exec();
  }
}
