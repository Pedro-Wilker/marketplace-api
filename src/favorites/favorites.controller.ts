import { Controller, Get, Post, Body, Query, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { FavoritesService } from './favorites.service';
import { ToggleFavoriteDto } from './dto/toggle-favorite.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@ApiTags('Favoritos')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post('toggle')
  @ApiOperation({ summary: 'Adicionar ou remover dos favoritos (Coraçãozinho)' })
  async toggle(@Req() req, @Body() dto: ToggleFavoriteDto) {
    return this.favoritesService.toggle(req.user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar meus favoritos' })
  @ApiQuery({ name: 'type', enum: ['merchant', 'professional', 'service', 'product'], required: true })
  async findMyFavorites(
    @Req() req, 
    @Query('type') type: 'merchant' | 'professional' | 'service' | 'product'
  ) {
    if (!type) throw new BadRequestException('Você precisa informar o tipo de favorito que deseja listar (?type=...).');
    return this.favoritesService.findMyFavorites(req.user.sub, type);
  }
}