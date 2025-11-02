import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order, OrderDocument } from './order.schema';
import { MenuService } from '../menu/menu.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private readonly menuService: MenuService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  private async sendWhatsapp(order: OrderDocument) {
    try {
      const rincianMenu = order.orders
        .map(orderItem => {
          let detailItem = `- ${orderItem.name} (x${orderItem.kuantiti})`;
          if (orderItem.pilihan_opsi && Object.keys(orderItem.pilihan_opsi).length > 0) {
            const detailOpsi = Object.values(orderItem.pilihan_opsi).join(', ');
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

      this.logger.log(`Sending WhatsApp message for order ${order._id} to ${payload.number}`);
      
      await firstValueFrom(
        this.httpService.post(this.configService.get<string>('WHATSAPP_GATEWAY')+'/kirim-pesan', payload),
      );

      this.logger.log(`WhatsApp message sent successfully for order ${order._id}`);
    } catch (baileysError) {
      this.logger.error(
        `Failed to send WhatsApp message for order ${order._id}`,
        baileysError.stack,
      );
      throw new Error('Failed to send WhatsApp message');
    }
  }

  async create(createOrderDto: CreateOrderDto): Promise<OrderDocument> {
    let totalModalKeseluruhan = 0;
    let totalMarginKeseluruhan = 0;

    const enrichedOrders = await Promise.all(
      createOrderDto.orders.map(async (item) => {
        const menuItem = await this.menuService.findById(item.menu_id);

        if (!menuItem) {
          throw new NotFoundException(
            `Menu dengan ID ${item.menu_id} tidak ditemukan.`,
          );
        }

        if (menuItem.stok < item.kuantiti) {
          throw new BadRequestException(
            `Stok untuk menu "${menuItem.name}" tidak mencukupi. Sisa stok: ${menuItem.stok}`,
          );
        }

        menuItem.stok -= item.kuantiti;
        await menuItem.save();

        const subtotalModal = menuItem.modal * item.kuantiti;
        const subtotalMargin = item.sub_total - subtotalModal;

        totalModalKeseluruhan += subtotalModal;
        totalMarginKeseluruhan += subtotalMargin;

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
      total_margin_keseluruhan: totalMarginKeseluruhan,
    };

    const createdOrder = new this.orderModel({
      ...orderData,
      _id: createOrderDto._id,
    });

    try {
      const savedOrder = await createdOrder.save();
      this.logger.log(`Order successfully saved with ID: ${savedOrder._id}`);
      await this.sendWhatsapp(savedOrder);
      return savedOrder;
    } catch (error) {
      this.logger.error('Failed to save order to database', error.stack, { data: orderData });
      throw error;
    }
  }

  async findByMonth(year: number, month: number): Promise<Order[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    return this.orderModel.find({
      timestamp: {
        $gte: startDate,
        $lt: endDate,
      },
    }).exec();
  }

  async remove(id: string): Promise<OrderDocument> {
    const order = await this.orderModel.findById(id);
    if (!order) {
      throw new NotFoundException(`Order with ID "${id}" not found`);
    }

    for (const item of order.orders) {
      try {
        // --- PERBAIKAN DI SINI ---
        const menuItem = await this.menuService.findById(String(item.menu_id));
        // -------------------------
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
    await this.sendWhatsapp(order);
    return { status: 'Message sent' };
  }
}
