import { Controller, Get, Post, Body, Param, Delete, UseGuards, Req, NotFoundException, Patch, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiQuery } from '@nestjs/swagger';
// Removi FilesInterceptor pois o upload agora é feito via UploadController
import { ServicesService } from './services.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CreateServiceDto } from './dto/create-service.dto';

@ApiTags('Serviços')
@Controller('services')
export class ServicesController {
  constructor(
    private readonly servicesService: ServicesService
  ) { }

  @Post()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  // CORREÇÃO 1: Adicionado 'merchant' e 'prefecture' para permitir acesso
  @Roles('professional', 'merchant', 'prefecture') 
  @ApiOperation({ summary: 'Cadastrar serviço' })
  // CORREÇÃO 2: Aceita JSON, não mais multipart
  @ApiBody({ type: CreateServiceDto }) 
  async create(
    @Req() req,
    @Body() dto: CreateServiceDto,
  ) {
    // CORREÇÃO 3: Passamos o DTO direto. 
    // Certifique-se que seu CreateServiceDto possui o campo 'imageUrl' opcional.
    // O service deve pegar a imagem de dentro do DTO agora.
    return this.servicesService.create(req.user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar serviços' })
  @ApiQuery({ name: 'professionalId', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  findAll(
    @Query('professionalId') professionalId?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.servicesService.findAll({ professionalId, categoryId });
  }

  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  // CORREÇÃO: Permissões atualizadas aqui também
  @Roles('professional', 'merchant', 'prefecture')
  @ApiOperation({ summary: 'Remover serviço' })
  remove(@Req() req, @Param('id') id: string) {
    return this.servicesService.remove(req.user.sub, id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar serviço por ID' })
  async findOne(@Param('id') id: string) {
    const service = await this.servicesService.findOne(id);
    if (!service) throw new NotFoundException('Serviço não encontrado');
    return service;
  }

  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  // CORREÇÃO: Permissões atualizadas aqui também
  @Roles('professional', 'merchant', 'prefecture')
  @ApiOperation({ summary: 'Atualizar serviço' })
  async update(@Req() req, @Param('id') id: string, @Body() dto: Partial<CreateServiceDto>) {
    return this.servicesService.update(req.user.sub, id, dto);
  }

  @Get('featured')
  @ApiOperation({ summary: 'Listar serviços em destaque' })
  findFeatured() {
    return this.servicesService.findFeatured();
  }
}