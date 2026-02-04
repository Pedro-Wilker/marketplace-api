import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import { services, reviews } from '../db/schema'; 
import { eq, and, sql, desc } from 'drizzle-orm';
import { CreateServiceDto } from './dto/create-service.dto';

@Injectable()
export class ServicesService {
  constructor(
    @Inject('DRIZZLE') private readonly db: NodePgDatabase<typeof schema>,
  ) { }

  async create(userId: string, data: CreateServiceDto) {
    
 
    const [newService] = await this.db
      .insert(services)
      .values({
        professionalId: userId,
        name: data.name,
        description: data.description,
        priceType: data.priceType,
        price: data.price?.toString(),
        estimatedDuration: data.estimatedDuration,
        categoryId: data.categoryId,
       image: data.imageUrl, 
      })
      .returning();

    return newService;
  }

  async findAll(filters?: { professionalId?: string; categoryId?: string }) {
    // Adicionei .select() explícito para garantir que a imagem venha
    const query = this.db.select().from(services);

    if (filters?.professionalId) {
      query.where(eq(services.professionalId, filters.professionalId));
    }

    if (filters?.categoryId) {
      query.where(eq(services.categoryId, filters.categoryId));
    }

    return await query;
  }

  async findFeatured() {
    return await this.db
      .select({
        id: services.id,
        name: services.name,
        description: services.description,
        categoryId: services.categoryId,
        price: services.price,
        image: services.image, // <--- Incluindo imagem na listagem
        avgRating: sql<number>`COALESCE(AVG(${reviews.rating}), 0)`,
        reviewCount: sql<number>`COUNT(${reviews.id})`,
      })
      .from(services)
      .leftJoin(reviews, eq(services.id, reviews.serviceId))
      .groupBy(services.id)
      .orderBy(desc(sql`COALESCE(AVG(${reviews.rating}), 0)`))
      .limit(4); 
  }

  async findOne(id: string) {
    const [service] = await this.db.select().from(services).where(eq(services.id, id)).limit(1);
    return service || null;
  }

  async remove(userId: string, serviceId: string) {
    const result = await this.db
      .delete(services)
      .where(and(eq(services.id, serviceId), eq(services.professionalId, userId)))
      .returning();

    if (result.length === 0) throw new NotFoundException('Serviço não encontrado ou acesso negado');
    return { message: 'Serviço removido' };
  }

  async update(userId: string, serviceId: string, data: Partial<CreateServiceDto>) {
    // Verificação de existência
    const [service] = await this.db
      .select()
      .from(services)
      .where(and(eq(services.id, serviceId), eq(services.professionalId, userId)))
      .limit(1);

    if (!service) {
      throw new NotFoundException('Serviço não encontrado ou você não tem permissão para editá-lo.');
    }

    const [updatedService] = await this.db
      .update(services)
      .set({
        name: data.name,
        description: data.description,
        priceType: data.priceType,
        price: data.price?.toString(),
        estimatedDuration: data.estimatedDuration,
        categoryId: data.categoryId,
        image: data.imageUrl, 
      })
      .where(eq(services.id, serviceId))
      .returning();

    return updatedService;
  }
}