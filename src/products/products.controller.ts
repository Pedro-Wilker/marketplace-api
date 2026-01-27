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
  UsePipes,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ProductOwnershipGuard } from 'src/auth/guards/ownership.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UploadService } from '../upload/upload.service';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { CreateProductDto } from './dto/create-product.dto';

@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly uploadService: UploadService,
  ) { }

  @Get()
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
  async findOne(@Param('id') id: string) {
    const product = await this.productsService.findOne(id);
    if (!product) throw new NotFoundException('Produto não encontrado');
    return product;
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('merchant')
  @UseInterceptors(FilesInterceptor('images', 10)) 
  @UsePipes(new ZodValidationPipe(CreateProductDto))
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
  @UseGuards(JwtAuthGuard, ProductOwnershipGuard)
  async update(@Param('id') id: string, @Body() updateProductDto: any) {
    const updated = await this.productsService.update(id, updateProductDto);
    if (!updated) throw new NotFoundException('Produto não encontrado');
    return updated;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, ProductOwnershipGuard)
  async remove(@Param('id') id: string) {
    const deleted = await this.productsService.remove(id);
    if (!deleted) throw new NotFoundException('Produto não encontrado');
    return { message: 'Produto removido com sucesso' };
  }
}