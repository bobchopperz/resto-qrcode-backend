import { Injectable, Logger } from '@nestjs/common'; // Impor Logger
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Config, ConfigDocument } from './whatsapp-config.schema';

@Injectable()
export class WhatsappConfigService {
  private readonly logger = new Logger(WhatsappConfigService.name); // Inisialisasi Logger

  constructor(
    @InjectModel(Config.name) private configModel: Model<ConfigDocument>,
  ) {}

  async getWhatsappForwardingConfig(): Promise<Record<string, any>> {
    const configName = 'whatsappforwarding';
    let config = await this.configModel.findOne({ name: configName }).exec();

    if (!config) {
      this.logger.log(`Config '${configName}' not found, creating default.`);
      const defaultConfig = {
        name: configName,
        value: {
          'kitchen-forwarding': true,
          'waiter-forwarding': true,
        },
      };
      config = new this.configModel(defaultConfig);
      await config.save();
    }

    return config.value;
  }

  async updateWhatsappForwardingConfig(newValues: { 'kitchen-forwarding': boolean; 'waiter-forwarding': boolean }): Promise<Record<string, any>> {
    const configName = 'whatsappforwarding';
    this.logger.log(`Received update for '${configName}': ${JSON.stringify(newValues)}`); // Log data yang diterima

    const updatedConfig = await this.configModel.findOneAndUpdate(
      { name: configName },
      { $set: { value: newValues } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).exec();

    if (!updatedConfig) {
      this.logger.error(`Failed to update config '${configName}'.`);
      throw new Error(`Failed to update config '${configName}'.`);
    }

    this.logger.log(`Config '${configName}' updated to: ${JSON.stringify(updatedConfig.value)}`);
    return updatedConfig.value;
  }
}
