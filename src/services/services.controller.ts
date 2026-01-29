import { Controller, Get, Post, Body, Param, Delete, UseGuards, Req, UseInterceptors, UploadedFiles, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody, ApiQuery } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ServicesService } from './services.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UploadService } from 'src/upload/upload.service';
import { CreateServiceDto } from './dto/create-service.dto';

@ApiTags('Serviços (Profissionais)')
@Controller('services')
export class ServicesController {
  constructor(
    private readonly servicesService: ServicesService,
    private readonly uploadService: UploadService
  ) { }

  @Post()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('professional')
  @UseInterceptors(FilesInterceptor('portfolio', 5))
  @ApiOperation({ summary: 'Cadastrar serviço (Com Upload)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      allOf: [
        { $ref: '#/components/schemas/CreateServiceDto' },
        {
          type: 'object',
          properties: {
            portfolio: {
              type: 'array',
              items: { type: 'string', format: 'binary' },
            },
          },
        },
      ],
    },
  })
  async create(
    @Req() req,
    @Body() dto: CreateServiceDto,
    @UploadedFiles() files: Express.Multer.File[]
  ) {
    const imageUrls = files?.length ? await this.uploadService.uploadMultipleImages(files) : [];

    return this.servicesService.create(req.user.sub, dto, imageUrls);
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
  @Roles('professional')
  @ApiOperation({ summary: 'Remover serviço' })
  remove(@Req() req, @Param('id') id: string) {
    return this.servicesService.remove(req.user.sub, id);
  }
}