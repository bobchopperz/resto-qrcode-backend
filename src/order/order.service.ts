import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order, OrderDocument } from './order.schema';
import { MenuService } from '../menu/menu.service';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private readonly menuService: MenuService, // Inject MenuService
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<OrderDocument> {
    let totalModalKeseluruhan = 0;
    let totalMarginKeseluruhan = 0;

    // Gunakan Promise.all untuk memproses semua item secara paralel
    const enrichedOrders = await Promise.all(
      createOrderDto.orders.map(async (item) => {
        const menuItem = await this.menuService.findById(item.menu_id);

        if (!menuItem) {
          throw new NotFoundException(
            `Menu dengan ID ${item.menu_id} tidak ditemukan.`,
          );
        }

        const subtotalModal = menuItem.modal * item.kuantiti;
        const subtotalMargin = item.sub_total - subtotalModal;

        // Akumulasi total
        totalModalKeseluruhan += subtotalModal;
        totalMarginKeseluruhan += subtotalMargin;

        return {
          ...item,
          menu_id: menuItem._id, // pastikan ini adalah ObjectId
          modal: menuItem.modal,
          subtotal_modal: subtotalModal,
          subtotal_margin: subtotalMargin,
        };
      }),
    );

    const orderData = {
      ...createOrderDto,
      orders: enrichedOrders,
      timestamp: new Date(createOrderDto.timestamp['$date']), // Konversi ke objek Date
      total_modal_keseluruhan: totalModalKeseluruhan,
      total_margin_keseluruhan: totalMarginKeseluruhan,
    };

    this.logger.log('Preparing order data for database insertion.');
    this.logger.verbose({ message: 'Final order data', data: orderData });

    // Buat instance model dengan _id yang ditentukan secara manual
    const createdOrder = new this.orderModel({
      ...orderData,
      _id: createOrderDto._id, // Set _id secara eksplisit
    });

    try {
      const savedOrder = await createdOrder.save();
      this.logger.log(`Order successfully saved with ID: ${savedOrder._id}`);
      return savedOrder;
    } catch (error) {
      this.logger.error('Failed to save order to database', error.stack, { data: orderData });
      throw error;
    }
  }
}