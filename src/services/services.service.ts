import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import { services, professionalProfiles } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { CreateServiceDto } from './dto/create-service.dto';

@Injectable()
export class ServicesService {
  constructor(
    @Inject('DRIZZLE') private readonly db: NodePgDatabase<typeof schema>,
  ) { }

  async create(userId: string, data: CreateServiceDto, portfolioImages: string[] = []) {
    const [profile] = await this.db
      .select()
      .from(professionalProfiles)
      .where(eq(professionalProfiles.userId, userId))
      .limit(1);

    if (!profile) {
      throw new BadRequestException('Você precisa ser um profissional para criar serviços.');
    }

  
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
      })
      .returning();

  
    return newService;
  }

  async findAll(professionalId?: string) {
    const query = this.db.select().from(services);
    if (professionalId) {
      query.where(eq(services.professionalId, professionalId));
    }
    return await query;
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
}