import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose'; // <-- PERBAIKAN: Menambahkan import 'Types'
import { CreateOrderDto } from './dto/create-order.dto';
import { Order, OrderDocument, OrderItem } from './order.schema';
import { Menu, MenuDocument } from '../menu/menu.schema';
import { OpsiMenu, OpsiMenuDocument } from '../opsi-menu/opsi-menu.schema';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { WhatsappConfigService } from '../whatsapp-config/whatsapp-config.service';
import { UserService } from '../user/user.service';

@Injectable()
export class OrderService {
    private readonly logger = new Logger(OrderService.name);

    constructor(
        @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
        @InjectModel(Menu.name) private readonly menuModel: Model<MenuDocument>,
        @InjectModel(OpsiMenu.name) private readonly opsiMenuModel: Model<OpsiMenuDocument>,
        private readonly httpService: HttpService,
        private readonly nestConfigService: NestConfigService,
        private readonly whatsappConfigService: WhatsappConfigService,
        private readonly userService: UserService,
    ) {}

    private async sendWhatsappToCustomer(order: OrderDocument) {

        try {
            const rincianMenu = order.items.map(orderItem => {
                let detailItem = `· ${orderItem.nama_menu} : ${orderItem.jumlah} porsi`;
                if (orderItem.opsi_terpilih && orderItem.opsi_terpilih.length > 0) {
                    const detailOpsi = orderItem.opsi_terpilih.map(opsi => `${opsi.nama_opsi} : ${opsi.pilihan}, total harga : ${orderItem.jumlah * opsi.harga_jual}`).join(`\n· `);
                    detailItem += `\n· ${detailOpsi} \n`;
                }
                return detailItem;
            }).join('\n');

            const tanggalOrder = order.timestamp.toLocaleDateString('id-ID',{
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
                timeZone: 'Asia/Jakarta',
            });

            const message = `Halo Kak ${order.nama_pelanggan}, rincian order Kakak ${tanggalOrder} sebagai berikut : \n\n${rincianMenu} \n\n Total Order : Rp ${order.total_modal_keseluruhan.toLocaleString('id-ID')} \n\n Mohon ditunggu :) `;

            const payload = {
                number: order.no_wa_pelanggan,
                message: message,
            };

            this.logger.log(`sending Whatsapp order to ${payload.number} `);

            await firstValueFrom(
              this.httpService.post(this.nestConfigService.get<string>('WHATSAPP_GATEWAY')+'/kirim-pesan', payload),
            );

            this.logger.log(`sending Whatsapp order to customer is success`);

        } catch (Error) {
            console.log(Error);
        }
    }

    private async forwardToKitchen(order: OrderDocument) {

        try{
            const whatsappconfig = await this.whatsappConfigService.getWhatsappForwardingConfig();

            if (!whatsappconfig['kitchen-forwarding']){
                this.logger.log('kitchen-forwarding is not active');
                return;
            }

            const kitchenUsers = await this.userService.findByRole('kitchen');
            if (kitchenUsers.length === 0) {
                this.logger.log('no users with kitchen role');
                return;
            }

            const rincianMenu = order.items.map(orderItem => {
                let detailItem = `· ${orderItem.nama_menu} : ${orderItem.jumlah} porsi`;
                if (orderItem.opsi_terpilih && orderItem.opsi_terpilih.length > 0) {
                    const detailOpsi = orderItem.opsi_terpilih.map(opsi => `${opsi.nama_opsi} : ${opsi.pilihan}`).join(`\n· `);
                    detailItem += `\n· ${detailOpsi} \n`;
                }
                return detailItem;
            }).join('\n');

            const tanggalOrder = order.timestamp.toLocaleDateString('id-ID',{
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
                timeZone: 'Asia/Jakarta',
            });

            for (const kitchenUser of kitchenUsers) {
                if (kitchenUser.handphone) {

                    const message = `Halo Kitchen ${kitchenUser.name}, ada orderan atas nama : ${order.nama_pelanggan}, tanggal ${tanggalOrder}\n\n Rincian Pesanan :\n\n${rincianMenu}\n\nMohon segera diproses.`;
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


        } catch (Error) {
            console.log(Error);
        }
    }

    async create(createOrderDto: CreateOrderDto): Promise<OrderDocument> {
        let total_jual_keseluruhan = 0;
        let total_modal_keseluruhan = 0;

        const processedItems: OrderItem[] = [];

        for (const itemDto of createOrderDto.items) {
            const menu = await this.menuModel.findById(itemDto.menuId).exec();
            if (!menu) {
                throw new NotFoundException(`Menu dengan ID "${itemDto.menuId}" tidak ditemukan.`);
            }
            if (menu.stok < itemDto.jumlah) {
                throw new BadRequestException(`Stok untuk menu "${menu.name}" tidak mencukupi. Sisa stok: ${menu.stok}`);
            }

            let harga_jual_satuan = menu.price;
            let modal_satuan = menu.modal;

            const opsi_terpilih_processed = [];

            if (itemDto.opsi_terpilih && itemDto.opsi_terpilih.length > 0) {
                for (const opsiDto of itemDto.opsi_terpilih) {
                    const opsiGroup = await this.opsiMenuModel.findOne({ nama_opsi: opsiDto.nama_opsi }).exec();
                    if (!opsiGroup) {
                        throw new NotFoundException(`Grup Opsi "${opsiDto.nama_opsi}" tidak ditemukan.`);
                    }

                    const pilihanData = opsiGroup.list_opsi.find(p => p.pilihan === opsiDto.pilihan);
                    if (!pilihanData) {
                        throw new NotFoundException(`Pilihan "${opsiDto.pilihan}" tidak ditemukan di grup "${opsiDto.nama_opsi}".`);
                    }

                    harga_jual_satuan += Number(pilihanData.harga_jual);
                    modal_satuan += Number(pilihanData.modal);

                    opsi_terpilih_processed.push({
                        nama_opsi: opsiDto.nama_opsi,
                        pilihan: pilihanData.pilihan,
                        harga_jual: Number(pilihanData.harga_jual),
                    });
                }
            }

            const subtotal_jual = harga_jual_satuan * itemDto.jumlah;
            const subtotal_modal = modal_satuan * itemDto.jumlah;
            const subtotal_margin = subtotal_jual - subtotal_modal;

            total_jual_keseluruhan += subtotal_jual;
            total_modal_keseluruhan += subtotal_modal;

            processedItems.push({
                menu: menu._id as Types.ObjectId, // <-- PERBAIKAN: Menambahkan Type Assertion
                nama_menu: menu.name,
                harga_jual_satuan,
                jumlah: itemDto.jumlah,
                opsi_terpilih: opsi_terpilih_processed,
                subtotal_jual,
                subtotal_modal,
                subtotal_margin,
            });

            menu.stok -= itemDto.jumlah;
            await menu.save();
        }

        const total_margin_keseluruhan = total_jual_keseluruhan - total_modal_keseluruhan;

        const newOrder = new this.orderModel({
            nama_pelanggan: createOrderDto.nama_pelanggan,
            no_wa_pelanggan: createOrderDto.no_wa_pelanggan,
            items: processedItems,
            total_jual_keseluruhan,
            total_modal_keseluruhan,
            total_margin_keseluruhan,
            timestamp: new Date(), // <-- TAMBAHKAN BARIS INI
        });

        try {
            const savedOrder = await newOrder.save();

            this.logger.log(`Order successfully saved with ID: ${savedOrder._id}`);

            await this.sendWhatsappToCustomer(savedOrder);
            await this.forwardToKitchen(savedOrder);

            return savedOrder;
        } catch (error) {
            this.logger.error('Failed to save order to database', error.stack);
            for (const itemDto of createOrderDto.items) {
                const menu = await this.menuModel.findById(itemDto.menuId).exec();
                if(menu) {
                    menu.stok += itemDto.jumlah;
                    await menu.save();
                }
            }
            throw error;
        }
    }

    async findByMonth(year: number, month: number): Promise<Order[]> {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 1);
        return this.orderModel.find({ createdAt: { $gte: startDate, $lt: endDate } }).exec();
    }

    async remove(id: string): Promise<OrderDocument> {
        const order = await this.orderModel.findById(id);
        if (!order) {
            throw new NotFoundException(`Order with ID "${id}" not found`);
        }

        for (const item of order.items) {
            try {
                const menuItem = await this.menuModel.findById(String(item.menu));
                if (menuItem) {
                    menuItem.stok += item.jumlah;
                    await menuItem.save();
                }
            } catch (error) {
                this.logger.error(`Failed to restock menu item ${item.menu} for deleted order ${id}`, error.stack);
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
        // await this.sendWhatsappToCustomer(order);
        return { status: 'Message sent' };
    }
}
