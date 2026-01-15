import { Injectable, CanActivate, ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ProductsService } from '../../products/products.service';

@Injectable()
export class ProductOwnershipGuard implements CanActivate {
  constructor(private productsService: ProductsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const productId = request.params.id;

    const product = await this.productsService.findOne(productId);
    if (!product) throw new NotFoundException('Produto não encontrado');

    if (product.merchantId !== user.sub) {
      throw new ForbiddenException('Você não é o dono deste produto');
    }

    return true;
  }
}