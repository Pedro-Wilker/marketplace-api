import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import { services, reviews, serviceFormFields } from '../db/schema';
import { eq, and, sql, desc, SQL } from 'drizzle-orm';
import { CreateServiceDto } from './dto/create-service.dto';

@Injectable()
export class ServicesService {
  constructor(
    @Inject('DRIZZLE') private readonly db: NodePgDatabase<typeof schema>,
  ) { }

  async create(userId: string, data: CreateServiceDto) {
    return await this.db.transaction(async (tx) => {

      const [newService] = await tx
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
          requiresCustomForm: data.requiresCustomForm || false,
        })
        .returning();

      if (data.requiresCustomForm && data.formFields && data.formFields.length > 0) {
        const fieldsToInsert = data.formFields.map((field) => ({
          serviceId: newService.id,
          label: field.label,
          type: field.type,
          isRequired: field.isRequired,
          options: field.options || null,
          orderIndex: field.orderIndex,
        }));

        await tx.insert(serviceFormFields).values(fieldsToInsert);
      }

      const completeService = await tx.query.services.findFirst({
        where: eq(services.id, newService.id),
        with: {
          formFields: true,
        }
      });

      return completeService;
    });
  }

  async findAll(filters?: { professionalId?: string; categoryId?: string }) {
    const conditions: SQL<unknown>[] = [];

    if (filters?.professionalId) {
      conditions.push(eq(services.professionalId, filters.professionalId));
    }

    if (filters?.categoryId) {
      conditions.push(eq(services.categoryId, filters.categoryId));
    }

    return await this.db.query.services.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        formFields: true 
      }
    });
  }

  async findFeatured() {
    return await this.db
      .select({
        id: services.id,
        name: services.name,
        description: services.description,
        categoryId: services.categoryId,
        price: services.price,
        image: services.image,
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
    const service = await this.db.query.services.findFirst({
      where: eq(services.id, id),
      with: {
        formFields: true
      }
    });

    if (!service) throw new NotFoundException('Serviço não encontrado');
    return service;
  }

  async remove(userId: string, serviceId: string) {
    const result = await this.db
      .delete(services)
      .where(and(eq(services.id, serviceId), eq(services.professionalId, userId)))
      .returning();

    if (result.length === 0) throw new NotFoundException('Serviço não encontrado ou acesso negado');
    return { message: 'Serviço removido com sucesso' };
  }

  async update(userId: string, serviceId: string, data: Partial<CreateServiceDto>) {

    const [service] = await this.db
      .select()
      .from(services)
      .where(and(eq(services.id, serviceId), eq(services.professionalId, userId)))
      .limit(1);

    if (!service) {
      throw new NotFoundException('Serviço não encontrado ou você não tem permissão para editá-lo.');
    }

    return await this.db.transaction(async (tx) => {

      const [updatedService] = await tx
        .update(services)
        .set({
          name: data.name,
          description: data.description,
          priceType: data.priceType,
          price: data.price?.toString(),
          estimatedDuration: data.estimatedDuration,
          categoryId: data.categoryId,
          image: data.imageUrl,
          requiresCustomForm: data.requiresCustomForm !== undefined ? data.requiresCustomForm : service.requiresCustomForm,
        })
        .where(eq(services.id, serviceId))
        .returning();

      if (data.formFields && data.requiresCustomForm) {
        await tx.delete(serviceFormFields).where(eq(serviceFormFields.serviceId, serviceId));

        const fieldsToInsert = data.formFields.map((field) => ({
          serviceId: serviceId,
          label: field.label,
          type: field.type,
          isRequired: field.isRequired,
          options: field.options || null,
          orderIndex: field.orderIndex,
        }));
        await tx.insert(serviceFormFields).values(fieldsToInsert);
      }

      return updatedService;
    });
  }
}