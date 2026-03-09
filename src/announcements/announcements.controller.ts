import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto, UpdateAnnouncementDto } from './dto/create-announcement.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

@ApiTags('Anúncios da Prefeitura (Mural)')
@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  
  @Get('feed')
  @ApiOperation({ summary: 'Feed de anúncios ativos para uma cidade' })
  @ApiQuery({ name: 'city', required: true, description: 'Nome da cidade do usuário' })
  async getFeed(@Query('city') city: string) {
    if (!city) throw new NotFoundException('A cidade é obrigatória para carregar o feed.');
    return this.announcementsService.findActiveFeedByCity(city);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhes de um anúncio específico' })
  async findOne(@Param('id') id: string) {
    return this.announcementsService.findOne(id);
  }


  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles('prefecture', 'admin') 
  @ApiOperation({ summary: 'Criar um novo anúncio' })
  async create(@Req() req, @Body() dto: CreateAnnouncementDto) {
    return this.announcementsService.create(req.user.sub, dto);
  }

  @Get('prefecture/mine')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles('prefecture', 'admin')
  @ApiOperation({ summary: 'Listar todos os anúncios criados por esta prefeitura' })
  async findMine(@Req() req) {
    return this.announcementsService.findAllByPrefecture(req.user.sub);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles('prefecture', 'admin')
  @ApiOperation({ summary: 'Atualizar ou pausar um anúncio' })
  async update(@Req() req, @Param('id') id: string, @Body() dto: UpdateAnnouncementDto) {
    return this.announcementsService.update(req.user.sub, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles('prefecture', 'admin')
  @ApiOperation({ summary: 'Excluir um anúncio permanentemente' })
  async remove(@Req() req, @Param('id') id: string) {
    return this.announcementsService.remove(req.user.sub, id);
  }
}