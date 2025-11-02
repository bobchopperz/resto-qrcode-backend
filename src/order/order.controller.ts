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

    @Get(':year/:month')
    async findByMonth(
        @Param('year') year: number,
        @Param('month') month: number,
    ) {
        return this.orderService.findByMonth(+year, +month);
    }
}
