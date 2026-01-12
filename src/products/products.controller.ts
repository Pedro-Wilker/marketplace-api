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
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

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
  async create(@Body() createProductDto: any) {
    
    return this.productsService.create(createProductDto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateProductDto: any) {
    const updated = await this.productsService.update(id, updateProductDto);
    if (!updated) throw new NotFoundException('Produto não encontrado');
    return updated;
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const deleted = await this.productsService.remove(id);
    if (!deleted) throw new NotFoundException('Produto não encontrado');
    return { message: 'Produto removido com sucesso' };
  }
}