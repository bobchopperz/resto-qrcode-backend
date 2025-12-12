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
import * as sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs/promises';
import { createReadStream } from 'fs';
import * as FormData from 'form-data';
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

    private generateReceiptSvg(order: OrderDocument, forReceipt : boolean): string {
        const tanggalOrder = order.timestamp.toLocaleTimeString('id-ID', {
            day:'2-digit', month:'short', year:'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Jakarta'
        });


        // kalo tanpa harga di receiptnya
        const itemsText = order.items.flatMap(item => {
            if (forReceipt === false) {
                const mainItemLine = `${item.jumlah} x ${item.nama_menu}`;
                const optionsLines = item.opsi_terpilih.map(o => `  • ${o.pilihan}`);
                return [mainItemLine, ...optionsLines];
            } else { // pake harga di receiptnya
                const mainItemLine = `${item.jumlah} x ${item.nama_menu}`;
                const optionsLines = item.opsi_terpilih.map(o =>
                    `  • ${o.pilihan}`);
                const totalHarga = `  • subtotal : ${(item.subtotal_jual * item.jumlah).toLocaleString('id-ID')}`;
                return [mainItemLine, ...optionsLines, totalHarga];
            }
        });

        let totalHarga =``;
        let footer=``;
        if (forReceipt === true) {
            totalHarga =` Total harga : ${(order.total_jual_keseluruhan).toLocaleString('id-ID')} `;
            footer = ' * Terima kasih atas kunjungannya * ';
        }

        const dash = `-----------------------------------------`;
        const font_weight = 570;

        const headerLines = [
            "**Bakso Pedas Nikmat **",
            dash,
            `Waktu : ${tanggalOrder} `,
            `Customer : ${order.nama_pelanggan}`,
            `Meja : ${order.nomor_meja}`
        ];

        const allLines = [...headerLines, dash, ...itemsText, dash, totalHarga, footer];

        const lineHeight = 40;
        const topPadding = 40;
        const leftPadding = 20;
        const svgHeight = allLines.length * lineHeight + (topPadding * 2);
        const svgWidth = 960;

        const textElements = allLines.map((line, index) => {
            const y = topPadding + (index * lineHeight);
            const isBold = line.startsWith('**');
            const cleanLine = line.replace(/\*\*/g, '');
            return `<text x="${leftPadding}" y="${y}" class="${isBold ? 'bold' : 'normal'}">${cleanLine}</text>`;
        }).join('');

        return `
            <svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">
                <rect width="100%" height="100%" fill="white"/>
                <style>
                    .normal { font: 32px 'Courier New', monospace; font-weight: ${font_weight}; }
                    .bold { font: bold 38px 'Courier New', monospace; text-anchor: middle; font-weight: ${font_weight}; }
                    text { fill: black; }
                    /* Center bold text */
                    .bold {
                        transform: translateX(${svgWidth / 2}px);
                    }
                </style>
                ${textElements}
            </svg>
        `;
    }


    private async forwardToKitchen(order: OrderDocument) {
        this.logger.log(`Starting forwardToKitchen process for order ${order._id}`);
        const tempDir = path.join(process.cwd(), 'public', 'receipt-temp');
        const imagePath = path.join(tempDir, `order-${order._id}.jpeg`);
        let imageGenerated = false;

        try {
            // 1. Cek apakah forwarding ke dapur aktif
            const whatsappconfig = await this.whatsappConfigService.getWhatsappForwardingConfig();
            if (!whatsappconfig['kitchen-forwarding']) {
                this.logger.log('kitchen-forwarding is not active. Skipping.');
                return;
            }

            // 2. Dapatkan data pengguna dengan peran 'kitchen'
            const kitchenUsers = await this.userService.findByRole('kitchen');
            if (kitchenUsers.length === 0) {
                this.logger.log('No users with kitchen role found. Skipping.');
                return;
            }

            // 3. Buat SVG dari data pesanan
            const receiptSvg = this.generateReceiptSvg(order, false); // kitchen includePrice = false
            const svgBuffer = Buffer.from(receiptSvg);

            // 4. Pastikan direktori ada, lalu generate gambar (dengan penanganan EEXIST)
            try {
                // Opsi recursive: true akan membuat direktori dan tidak akan error jika direktori sudah ada.
                await fs.mkdir(tempDir, { recursive: true });
            } catch (error) {
                // Jika errornya EEXIST, kemungkinan ada FILE (bukan folder) dengan nama yang sama.
                if (error.code === 'EEXIST') {
                    this.logger.warn(`Path ${tempDir} exists as a file. Deleting it to create a directory.`);
                    await fs.unlink(tempDir); // Hapus file yang menghalangi
                    await fs.mkdir(tempDir, { recursive: true }); // Coba lagi buat folder
                } else {
                    throw error; // Lemparkan kembali error lain yang tidak terduga
                }
            }
            await sharp(svgBuffer)
                .jpeg({ quality: 90 })
                .toFile(imagePath);

            imageGenerated = true;
            this.logger.log(`Generated kitchen order image at ${imagePath}`);

            // 5. Kirim gambar ke setiap pengguna dapur
            for (const kitchenUser of kitchenUsers) {
                if (kitchenUser.handphone) {
                    const formData = new FormData();
                    const tanggalOrder = order.timestamp.toLocaleTimeString('id-ID', {
                        hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta'
                    });
                    formData.append('number', kitchenUser.handphone);
                    formData.append('message', `Pesanan baru dari *${order.nama_pelanggan}* jam ${tanggalOrder}. Mohon segera diproses.`);
                    formData.append('image', createReadStream(imagePath));

                    this.logger.log(`Sending order image to kitchen user ${kitchenUser.username} (${kitchenUser.handphone})`);
                    await firstValueFrom(
                        this.httpService.post(this.nestConfigService.get<string>('WHATSAPP_GATEWAY') + '/kirim-media', formData, {
                            headers: formData.getHeaders(),
                        }),
                    );
                    this.logger.log(`Order image sent successfully to kitchen user ${kitchenUser.username}`);
                } else {
                    this.logger.warn(`Kitchen user ${kitchenUser.username} has no handphone number. Skipping.`);
                }
            }
        } catch (error) {
            this.logger.error('Failed in forwardToKitchen process', error.stack, error.response?.data);
        } finally {
            // 6. Hapus file gambar sementara setelah selesai
            if (imageGenerated) {
                await fs.unlink(imagePath);
                this.logger.log(`Removed temporary kitchen order image: ${imagePath}`);
            }
        }
    }

    private async forwardToWaiter(order: OrderDocument) {

        this.logger.log(`Starting forwardToWaiter process for order ${order._id}`);
        const tempDir= path.join(process.cwd(), 'public', 'receipt-temp');
        const imagePath = path.join(tempDir, `order-${order._id}.jpeg`);
        let imageGenerated = false;

        try{
            // 1. Cek apakah forwarding ke WA aktif
            const whatsappconfig = await this.whatsappConfigService.getWhatsappForwardingConfig();
            if (!whatsappconfig['waiter-forwarding']){
                this.logger.log('waiter-forwarding is not active');
                return;
            }

            // 2. Dapatkan user dengan role = 'waiter'
            const waiterUsers = await this.userService.findByRole('waiter');
            if (waiterUsers.length === 0) {
                this.logger.log('no users with waiter role');
                return;
            }

            // 3. Buat SVG dari data pesanam
            const receiptSvg = this.generateReceiptSvg(order, true); //waiter includePrice = true
            const svgBuffer = Buffer.from(receiptSvg);

            // 4. Pastikan direktori ada, lalu generate gambar dengan error exception EEXIST
            try {
                await fs.mkdir(tempDir, { recursive: true });
            } catch (error) {
                if (error.code === 'EEXIST') {
                    this.logger.warn(`Path ${tempDir} exist as a file. Deleting it to create a directory`);
                    await fs.unlink(tempDir);
                    await fs.mkdir(tempDir, { recursive: true });
                } else {
                    throw error;
                }
            }
            await sharp(svgBuffer)
                .jpeg({ quality: 90 })
                .toFile(imagePath);
            imageGenerated = true;
            this.logger.log(`Generated watier order image at ${imagePath}`);

            const tanggalOrder = order.timestamp.toLocaleTimeString('id-ID',{
                hour: 'numeric',
                minute: 'numeric',
                timeZone: 'Asia/Jakarta',
            });

            // 5. kirim file kw waiter
            for (const waiterUser of waiterUsers) {
                if (waiterUser.handphone) {
                    const formData = new FormData();
                    formData.append('number', waiterUser.handphone);
                    formData.append('message', `Pesanan atas nama ${order.nama_pelanggan} waktu : ${tanggalOrder}`);
                    formData.append('image', createReadStream(imagePath));

                    this.logger.log(`Sending order image to waiter user ${waiterUser.username}`);
                    await firstValueFrom(
                        this.httpService.post(this.nestConfigService.get<string>('WHATSAPP_GATEWAY') + '/kirim-media', formData, {
                            headers: formData.getHeaders(),
                        }),
                    );

                    this.logger.log(`WhatsApp message sent successfully to waiter user ${waiterUser.username}`);
                } else {
                    this.logger.warn(`Waiter user ${waiterUser.username} has no handphone number. Skipping.`);
                }
            }


        } catch (Error) {
            this.logger.error('Failed in forwardToWaiter process', Error.stack, Error.response?.data);
        } finally {
            // 6. Hapus file gambar sementara setelah selesai
            if (imageGenerated) {
                await fs.unlink(imagePath);
                this.logger.log(`Removed temporary waiter order image: ${imagePath}`);
            }
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
            nomor_meja: createOrderDto.nomor_meja,
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
            // await this.forwardToWaiter(savedOrder);

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