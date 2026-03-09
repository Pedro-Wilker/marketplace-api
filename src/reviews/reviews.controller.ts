import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@ApiTags('Avaliações')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Criar avaliação (Serviço, Loja, Produto ou Entregador)' })
  create(@Req() req, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(req.user.sub, dto);
  }

  @Get('service/:serviceId')
  @ApiOperation({ summary: 'Listar avaliações de um serviço' })
  findByService(@Param('serviceId') serviceId: string) {
    return this.reviewsService.findByTarget('serviceId', serviceId);
  }

  @Get('merchant/:merchantId')
  @ApiOperation({ summary: 'Listar avaliações de uma loja' })
  findByMerchant(@Param('merchantId') merchantId: string) {
    return this.reviewsService.findByTarget('merchantId', merchantId);
  }

  @Get('driver/:driverId')
  @ApiOperation({ summary: 'Listar avaliações de um motorista' })
  findByDriver(@Param('driverId') driverId: string) {
    return this.reviewsService.findByTarget('driverId', driverId);
  }

  @Get('product/:productId')
  @ApiOperation({ summary: 'Listar avaliações de um produto' })
  findByProduct(@Param('productId') productId: string) {
    return this.reviewsService.findByTarget('productId', productId);
  }
}