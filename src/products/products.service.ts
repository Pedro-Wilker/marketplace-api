import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import { products } from '../db/schema';
import { eq, and, SQL, sql } from 'drizzle-orm';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';

type Product = InferSelectModel<typeof products>;
type NewProduct = InferInsertModel<typeof products>;

@Injectable()
export class ProductsService {
  constructor(
    @Inject('DRIZZLE') private readonly db: NodePgDatabase<typeof schema>,
  ) { }

  async findAll(
    filters?: {
      merchantId?: string;
      categoryId?: string;
      isAvailable?: boolean;
    },
    limit = 50,
    offset = 0,
  ): Promise<Product[]> {
    const conditions: SQL<unknown>[] = [];

    if (filters?.merchantId) {
      conditions.push(eq(products.merchantId, filters.merchantId));
    }
    if (filters?.categoryId) {
      conditions.push(eq(products.categoryId, filters.categoryId));
    }
    if (filters?.isAvailable !== undefined) {
      conditions.push(eq(products.isAvailable, filters.isAvailable));
    }

    const queryWithFilter = conditions.length > 0
      ? this.db.select().from(products).where(and(...conditions))
      : this.db.select().from(products);

    return await queryWithFilter.limit(limit).offset(offset);
  }

  async findOne(id: string): Promise<Product | null> {
    const [product] = await this.db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    return product ?? null;
  }

  async create(data: NewProduct): Promise<Product> {
    const [newProduct] = await this.db
      .insert(products)
      .values({
        ...data,
        images: data.images || [],
      })
      .returning();

    if (!newProduct) {
      throw new Error('Falha ao criar produto');
    }

    return newProduct;
  }

  async update(id: string, data: Partial<NewProduct>): Promise<Product | null> {
    const [updatedProduct] = await this.db
      .update(products)
      .set(data)
      .where(eq(products.id, id))
      .returning();

    return updatedProduct ?? null;
  }

  async remove(id: string): Promise<boolean> {
    const result = await this.db.delete(products).where(eq(products.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async updateStock(id: string, quantityChange: number): Promise<Product | null> {
    const [updated] = await this.db
      .update(products)
      .set({
         stockQuantity: sql`${products.stockQuantity} + ${quantityChange}`
      })
      .where(and(
        eq(products.id, id),
        sql`${products.stockQuantity} + ${quantityChange} >= 0`
      ))
      .returning();

    if (!updated) {
      const exists = await this.findOne(id);
      if (!exists) throw new NotFoundException('Produto não encontrado');
      throw new BadRequestException('Estoque insuficiente para esta operação');
    }

    return updated;
  }
}