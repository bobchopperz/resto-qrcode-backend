import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WhatsappConfigController } from './whatsapp-config.controller';
import { WhatsappConfigService } from './whatsapp-config.service';
import { Config, ConfigSchema } from './whatsapp-config.schema';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Config.name, schema: ConfigSchema }]),
    UserModule,
  ],
  controllers: [WhatsappConfigController],
  providers: [WhatsappConfigService],
  exports: [WhatsappConfigService], // Tambahkan baris ini untuk mengekspor service
})
export class WhatsappConfigModule {}
