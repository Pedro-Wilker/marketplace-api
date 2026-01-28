import { Controller, Post, Body, UseGuards, Req, UsePipes, Get } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { CreateOrderDto } from './dto/create-order.dto';

@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(CreateOrderDto))
  async create(@Req() req, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(req.user.sub, dto);
  }

  @Get('my-orders')
  async findMyOrders(@Req() req) {
    return this.ordersService.findAllByUser(req.user.sub, 'customer');
  }
  
  @Get('merchant-orders')
  async findMerchantOrders(@Req() req) {
    return this.ordersService.findAllByUser(req.user.sub, 'merchant');
  }
}