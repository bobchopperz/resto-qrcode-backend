import { Controller, Post, Body, Get, Param, Delete, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../user/jwt-auth.guard';

@Controller('order')
export class OrderController {
    constructor(private readonly orderService: OrderService) {}

    @Post()
    async create(@Body() createOrderDto: CreateOrderDto) {
        return this.orderService.create(createOrderDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':year/:month')
    async findByMonth(
        @Param('year') year: number,
        @Param('month') month: number,
    ) {
        return this.orderService.findByMonth(+year, +month);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    async remove(@Param('id') id: string) {
        await this.orderService.remove(id);
        return { message: 'Order successfully deleted' };
    }
}
