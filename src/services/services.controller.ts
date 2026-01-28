import { Controller, Get, Post, Body, Param, Delete, UseGuards, Req, UseInterceptors, UploadedFiles, UsePipes, Query } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ServicesService } from './services.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UploadService } from 'src/upload/upload.service';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { CreateServiceDto } from './dto/create-service.dto';

@Controller('services')
export class ServicesController {
  constructor(
    private readonly servicesService: ServicesService,
    private readonly uploadService: UploadService
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('professional')
  @UseInterceptors(FilesInterceptor('portfolio', 5)) 
  @UsePipes(new ZodValidationPipe(CreateServiceDto))
  async create(
    @Req() req, 
    @Body() dto: CreateServiceDto,
    @UploadedFiles() files: Express.Multer.File[]
  ) {
    const imageUrls = files?.length ? await this.uploadService.uploadMultipleImages(files) : [];
    return this.servicesService.create(req.user.sub, dto, imageUrls);
  }

  @Get()
  findAll(@Query('professionalId') profId?: string) {
    return this.servicesService.findAll(profId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('professional')
  remove(@Req() req, @Param('id') id: string) {
    return this.servicesService.remove(req.user.sub, id);
  }
}