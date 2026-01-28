import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  NotFoundException,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody, ApiQuery } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ProductOwnershipGuard } from 'src/auth/guards/ownership.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UploadService } from '../upload/upload.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@ApiTags('Produtos')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly uploadService: UploadService,
  ) { }

  @Get()
  @ApiOperation({ summary: 'Listar produtos com filtros' })
  @ApiQuery({ name: 'merchantId', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'isAvailable', required: false, type: Boolean })
  async findAll(
    @Query('merchantId') merchantId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('isAvailable') isAvailable?: string,
  ) {
    return this.productsService.findAll(
      {
        merchantId,
        categoryId,
        isAvailable: isAvailable === 'true' ? true : isAvailable === 'false' ? false : undefined,
      },
      50,
      0,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhes de um produto' })
  async findOne(@Param('id') id: string) {
    const product = await this.productsService.findOne(id);
    if (!product) throw new NotFoundException('Produto não encontrado');
    return product;
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('merchant')
  @UseInterceptors(FilesInterceptor('images', 10))
  @ApiOperation({ summary: 'Criar produto (Com Upload)' })
  @ApiConsumes('multipart/form-data') 
  @ApiBody({
    description: 'Dados do produto. As imagens são enviadas como arquivos binários.',
    schema: {
      allOf: [
        { $ref: '#/components/schemas/CreateProductDto' }, 
        {
          type: 'object',
          properties: {
            images: {
              type: 'array',
              items: { type: 'string', format: 'binary' },
            },
          },
        },
      ],
    },
  })
  async create(
    @Body() createProductDto: CreateProductDto, 
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
  ) {
    const imageUrls = files?.length 
      ? await this.uploadService.uploadMultipleImages(files) 
      : [];

    const finalData = {
      ...createProductDto,
      merchantId: req.user.sub, 
      images: imageUrls,
      price: createProductDto.price.toString(), 
    };

    return this.productsService.create(finalData);
  }

  @Patch(':id')
  @UseGuards(ProductOwnershipGuard)
  @ApiOperation({ summary: 'Atualizar produto' })
  async update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    const dataToUpdate = {
        ...updateProductDto,
        price: updateProductDto.price ? updateProductDto.price.toString() : undefined,
    };

    const updated = await this.productsService.update(id, dataToUpdate);
    
    if (!updated) throw new NotFoundException('Produto não encontrado');
    return updated;
  }

  @Delete(':id')
  @UseGuards(ProductOwnershipGuard)
  @ApiOperation({ summary: 'Remover produto' })
  async remove(@Param('id') id: string) {
    const deleted = await this.productsService.remove(id);
    if (!deleted) throw new NotFoundException('Produto não encontrado');
    return { message: 'Produto removido com sucesso' };
  }
}