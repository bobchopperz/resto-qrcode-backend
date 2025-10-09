import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('order')
export class OrderController {
    constructor(private readonly orderService: OrderService) {}

    @Post()
    async create(@Body() createOrderDto: CreateOrderDto) {
        return this.orderService.create(createOrderDto);
    }

    @Get(':year/:month')
    async findByMonth(
        @Param('year') year: number,
        @Param('month') month: number,
    ) {
        // This will call a new method in your service
        return this.orderService.findByMonth(+year, +month);
    }
}
