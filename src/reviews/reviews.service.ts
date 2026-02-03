import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import { reviews, serviceRequests, services, users } from '../db/schema'; // Adicione services e users
import { eq, and, desc, sql } from 'drizzle-orm';
import { CreateReviewDto } from './dto/create-review.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ReviewsService {
  constructor(
    @Inject('DRIZZLE') private readonly db: NodePgDatabase<typeof schema>,
    private readonly notificationsService: NotificationsService
  ) {}

  async create(authorId: string, data: CreateReviewDto) {
    if (data.requestId) {
        const [request] = await this.db
            .select()
            .from(serviceRequests)
            .where(and(
                eq(serviceRequests.id, data.requestId),
                eq(serviceRequests.customerId, authorId),
                eq(serviceRequests.status, 'completed')
            ))
            .limit(1);

        if (!request) {
            throw new BadRequestException('Você só pode avaliar serviços concluídos que você solicitou.');
        }
    }

    const [review] = await this.db
      .insert(reviews)
      .values({
        authorId,
        serviceId: data.serviceId,
        requestId: data.requestId,
        rating: data.rating,
        comment: data.comment,
      })
      .returning();

    const [serviceDetails] = await this.db
      .select({
        name: services.name,
        professionalId: services.professionalId,
      })
      .from(services)
      .where(eq(services.id, data.serviceId))
      .limit(1);

    if (serviceDetails) {
      const stars = '⭐'.repeat(data.rating);
      
      await this.notificationsService.create(
        serviceDetails.professionalId,
        'system',
        'Nova Avaliação Recebida!',
        `Seu serviço "${serviceDetails.name}" recebeu ${data.rating} estrelas! ${stars}`,
        '/dashboard/servicos' 
      );
    }

    return review;
  }

  async findByService(serviceId: string) {
    return await this.db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        comment: reviews.comment,
        createdAt: reviews.createdAt,
        authorName: users.name,
      })
      .from(reviews)
      .innerJoin(users, eq(reviews.authorId, users.id))
      .where(eq(reviews.serviceId, serviceId))
      .orderBy(desc(reviews.createdAt));
  }

  async getAverageRating(serviceId: string) {
    const [result] = await this.db
        .select({ 
            average: sql<number>`avg(${reviews.rating})::numeric(10,1)`,
            count: sql<number>`count(*)` 
        })
        .from(reviews)
        .where(eq(reviews.serviceId, serviceId));
    
    return result || { average: 0, count: 0 };
  }
}