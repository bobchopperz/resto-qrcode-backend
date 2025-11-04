import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order, OrderDocument } from './order.schema';
import { MenuService } from '../menu/menu.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService as NestConfigService } from '@nestjs/config'; // Alias NestJS ConfigService
import { WhatsappConfigService } from '../whatsapp-config/whatsapp-config.service'; // Import WhatsappConfigService
import { UserService } from '../user/user.service'; // Import UserService
import { UserDocument } from '../user/user.schema'; // Import UserDocument

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private readonly menuService: MenuService,
    private readonly httpService: HttpService,
    private readonly nestConfigService: NestConfigService, // Gunakan alias
    private readonly whatsappConfigService: WhatsappConfigService, // Inject WhatsappConfigService
    private readonly userService: UserService, // Inject UserService
  ) {}

  // --- FUNGSI PENGIRIMAN WHATSAPP TERPUSAT --- (untuk pelanggan)
  private async sendWhatsappToCustomer(order: OrderDocument) {
    try {
      const rincianMenu = order.orders
        .map(orderItem => {
          let detailItem = `- ${orderItem.name} (x${orderItem.kuantiti})`;
          if (orderItem.pilihan_opsi && orderItem.pilihan_opsi.size > 0) {
            const detailOpsi = [...orderItem.pilihan_opsi.values()].join(', ');
            detailItem += `\n  - ${detailOpsi}`;
          }
          return detailItem;
        })
        .join('\n\n');

      const tanggalOrder = order.timestamp.toLocaleDateString('id-ID',{
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          timeZone: 'Asia/Jakarta'
      });

      const message = `Halo Kak ${order.nama_pelanggan}, rincian order Kakak ${tanggalOrder} sebagai berikut :\n\n${rincianMenu}\n\nTotal Order: Rp ${order.total_kesuluruhan.toLocaleString('id-ID')}`;

      const payload = {
        number: order.no_wa_pelanggan,
        message: message,
      };

      this.logger.log(`Sending WhatsApp message for order ${order._id} to customer ${payload.number}`);
      
      await firstValueFrom(
        this.httpService.post(this.nestConfigService.get<string>('WHATSAPP_GATEWAY')+'/kirim-pesan', payload),
      );

      this.logger.log(`WhatsApp message sent successfully to customer for order ${order._id}`);
    } catch (baileysError) {
      this.logger.error(
        `Failed to send WhatsApp message to customer for order ${order._id}`,
        baileysError.stack,
      );
    }
  }

  // --- FUNGSI FORWARD KE KITCHEN ---
  private async forwardToKitchen(order: OrderDocument) {
    try {
      const whatsappConfig = await this.whatsappConfigService.getWhatsappForwardingConfig();

      if (!whatsappConfig['kitchen-forwarding']) {
        this.logger.log('Kitchen forwarding is disabled. Skipping.');
        return;
      }

      const kitchenUsers = await this.userService.findByRole('kitchen');
      if (kitchenUsers.length === 0) {
        this.logger.warn('No users with role kitchen found for kitchen forwarding.');
        return;
      }

      const rincianMenu = order.orders
        .map(orderItem => {
          let detailItem = `- ${orderItem.name} (x${orderItem.kuantiti})`;
          if (orderItem.pilihan_opsi && orderItem.pilihan_opsi.size > 0) {
            const detailOpsi = [...orderItem.pilihan_opsi.values()].join(', ');
            detailItem += `\n  - ${detailOpsi}`;
          }
          return detailItem;
        })
        .join('\n\n');

      const tanggalOrder = order.timestamp.toLocaleDateString('id-ID',{
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          timeZone: 'Asia/Jakarta'
      });

      const message = `Halo Kitchen, order\n\n atas nama: ${order.nama_pelanggan}\nTanggal Order: ${tanggalOrder}\n\nRincian Pesanan:\n${rincianMenu}\n\nTMohon segera diproses.`;

      for (const kitchenUser of kitchenUsers) {
        if (kitchenUser.handphone) {
          const payload = {
            number: kitchenUser.handphone,
            message: message,
          };

          this.logger.log(`Sending WhatsApp message for order ${order._id} to kitchen user ${kitchenUser.username} (${kitchenUser.handphone})`);
          await firstValueFrom(
            this.httpService.post(this.nestConfigService.get<string>('WHATSAPP_GATEWAY')+'/kirim-pesan', payload),
          );
          this.logger.log(`WhatsApp message sent successfully to kitchen user ${kitchenUser.username}`);
        } else {
          this.logger.warn(`Kitchen user ${kitchenUser.username} has no handphone number. Skipping.`);
        }
      }

    } catch (error) {
      this.logger.error(
        `Failed to forward order ${order._id} to kitchen`,
        error.stack,
      );
    }
  }

  async create(createOrderDto: CreateOrderDto): Promise<OrderDocument> {
    let totalModalKeseluruhan = 0;
    let totalMarginKesuluruhan = 0;

    const enrichedOrders = await Promise.all(
      createOrderDto.orders.map(async (item) => {
        const menuItem = await this.menuService.findById(item.menu_id);
        if (!menuItem) {
          throw new NotFoundException(`Menu dengan ID ${item.menu_id} tidak ditemukan.`);
        }
        if (menuItem.stok < item.kuantiti) {
          throw new BadRequestException(`Stok untuk menu "${menuItem.name}" tidak mencukupi. Sisa stok: ${menuItem.stok}`);
        }
        menuItem.stok -= item.kuantiti;
        await menuItem.save();

        const subtotalModal = menuItem.modal * item.kuantiti;
        const subtotalMargin = item.sub_total - subtotalModal;
        totalModalKeseluruhan += subtotalModal;
        totalMarginKesuluruhan += subtotalMargin;

        return {
          ...item,
          nama_menu: menuItem.name,
          menu_id: menuItem._id,
          modal: menuItem.modal,
          subtotal_modal: subtotalModal,
          subtotal_margin: subtotalMargin,
        };
      }),
    );

    const orderData = {
      ...createOrderDto,
      orders: enrichedOrders,
      timestamp: new Date(createOrderDto.timestamp['$date']),
      total_modal_keseluruhan: totalModalKeseluruhan,
      total_margin_keseluruhan: totalMarginKesuluruhan,
    };

    const createdOrder = new this.orderModel({
      ...orderData,
      _id: createOrderDto._id,
    });

    try {
      const savedOrder = await createdOrder.save();
      this.logger.log(`Order successfully saved with ID: ${savedOrder._id}`);
      
      // Mengirim WhatsApp ke pelanggan
      await this.sendWhatsappToCustomer(savedOrder);

      // Meneruskan order ke kitchen
      await this.forwardToKitchen(savedOrder);

      return savedOrder;
    } catch (error) {
      this.logger.error('Failed to save order to database', error.stack, { data: orderData });
      throw error;
    }
  }

  async findByMonth(year: number, month: number): Promise<Order[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);
    return this.orderModel.find({ timestamp: { $gte: startDate, $lt: endDate } }).exec();
  }

  async remove(id: string): Promise<OrderDocument> {
    const order = await this.orderModel.findById(id);
    if (!order) {
      throw new NotFoundException(`Order with ID "${id}" not found`);
    }

    for (const item of order.orders) {
      try {
        const menuItem = await this.menuService.findById(String(item.menu_id));
        if (menuItem) {
          menuItem.stok += item.kuantiti;
          await menuItem.save();
        }
      } catch (error) {
        this.logger.error(`Failed to restock menu item ${item.menu_id} for deleted order ${id}`, error.stack);
      }
    }

    await this.orderModel.findByIdAndDelete(id).exec();
    return order;
  }

  async resendWhatsappMessage(id: string): Promise<{ status: string }> {
    const order = await this.orderModel.findById(id).exec();
    if (!order) {
      throw new NotFoundException(`Order with ID "${id}" not found`);
    }
    // Mengirim WhatsApp ke pelanggan
    await this.sendWhatsappToCustomer(order);
    return { status: 'Message sent' };
  }
}
