import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CouponsService } from './coupons.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { ValidateCouponDto } from './dto/validate-coupon.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

@ApiTags('Cupões de Desconto')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  // ==========================================
  // ROTAS DO COMERCIANTE (MERCHANT)
  // ==========================================

  @Post()
  @UseGuards(RolesGuard)
  @Roles('merchant', 'admin')
  @ApiOperation({ summary: 'Criar um novo cupão' })
  async create(@Req() req, @Body() dto: CreateCouponDto) {
    return this.couponsService.create(req.user.sub, dto);
  }

  @Get('my-coupons')
  @UseGuards(RolesGuard)
  @Roles('merchant')
  @ApiOperation({ summary: 'Listar cupões da minha loja' })
  async findMyCoupons(@Req() req) {
    return this.couponsService.findAllByMerchant(req.user.sub);
  }

  @Patch(':id/toggle')
  @UseGuards(RolesGuard)
  @Roles('merchant', 'admin')
  @ApiOperation({ summary: 'Ativar/Desativar um cupão' })
  async toggleStatus(@Req() req, @Param('id') id: string) {
    return this.couponsService.toggleStatus(req.user.sub, id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('merchant', 'admin')
  @ApiOperation({ summary: 'Remover um cupão' })
  async remove(@Req() req, @Param('id') id: string) {
    return this.couponsService.remove(req.user.sub, id);
  }

  // ==========================================
  // ROTA DO CLIENTE (CARRINHO DE COMPRAS)
  // ==========================================

  @Post('validate')
  @ApiOperation({ summary: 'Validar cupão no carrinho de compras' })
  async validateCoupon(@Body() dto: ValidateCouponDto) {
    return this.couponsService.validate(dto);
  }
}