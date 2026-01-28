import { Controller, Post, Body, UseGuards, Req, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreateOrderDto } from './dto/create-order.dto';

@ApiTags('Pedidos')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Criar um novo pedido' })
  async create(@Req() req, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(req.user.sub, dto);
  }

  @Get('my-orders')
  @ApiOperation({ summary: 'Listar histórico de compras do cliente' })
  async findMyOrders(@Req() req) {
    return this.ordersService.findAllByUser(req.user.sub, 'customer');
  }
  
  @Get('merchant-orders')
  @ApiOperation({ summary: 'Listar vendas da loja (Merchant)' })
  async findMerchantOrders(@Req() req) {
    return this.ordersService.findAllByUser(req.user.sub, 'merchant');
  }
}