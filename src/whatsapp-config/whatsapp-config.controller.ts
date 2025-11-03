import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { WhatsappConfigService } from './whatsapp-config.service'; // Impor service baru
import { JwtAuthGuard } from '../user/jwt-auth.guard';

@Controller('whatsapp-config') // Path utama controller diubah
export class WhatsappConfigController { // Nama controller diubah
  constructor(private readonly configService: WhatsappConfigService) {}

  // Endpoint ini sekarang akan menjadi /whatsapp-config, bukan /whatsapp-config/whatsapp-forwarding
  @UseGuards(JwtAuthGuard)
  @Get()
  async getWhatsappForwardingConfig() {
    return this.configService.getWhatsappForwardingConfig();
  }

  @UseGuards(JwtAuthGuard)
  @Put()
  async updateWhatsappForwardingConfig(@Body() newValues: { 'kitchen-forwarding': boolean; 'waiter-forwarding': boolean }) {
    return this.configService.updateWhatsappForwardingConfig(newValues);
  }
}
