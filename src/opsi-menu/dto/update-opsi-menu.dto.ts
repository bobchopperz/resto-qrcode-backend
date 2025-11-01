import { PartialType } from '@nestjs/mapped-types';
import { CreateOpsiMenuDto } from './create-opsi-menu.dto';

export class UpdateOpsiMenuDto extends PartialType(CreateOpsiMenuDto) {}
