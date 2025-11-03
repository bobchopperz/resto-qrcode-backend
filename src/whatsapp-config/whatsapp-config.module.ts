import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WhatsappConfigController } from './whatsapp-config.controller';
import { WhatsappConfigService } from './whatsapp-config.service';
import { Config, ConfigSchema } from './whatsapp-config.schema'; // Impor dari schema lokal
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    // Nama fitur tetap 'Config' sesuai nama kelas skema
    MongooseModule.forFeature([{ name: Config.name, schema: ConfigSchema }]),
    UserModule,
  ],
  controllers: [WhatsappConfigController],
  providers: [WhatsappConfigService],
})
export class WhatsappConfigModule {}
