import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import { reviews, serviceRequests, services, users, orders, products } from '../db/schema';
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

        if (!request) throw new BadRequestException('Você só pode avaliar serviços concluídos que você solicitou.');
    }

    if (data.orderId) {
        const [order] = await this.db
            .select()
            .from(orders)
            .where(and(
                eq(orders.id, data.orderId),
                eq(orders.customerId, authorId),
                eq(orders.status, 'delivered')
            ))
            .limit(1);

        if (!order) throw new BadRequestException('Você só pode avaliar compras/entregas após o recebimento (delivered).');
    }

    const [review] = await this.db
      .insert(reviews)
      .values({
        authorId,
        serviceId: data.serviceId,
        merchantId: data.merchantId,
        driverId: data.driverId,
        productId: data.productId,
        requestId: data.requestId,
        orderId: data.orderId,
        rating: data.rating,
        comment: data.comment,
      })
      .returning();

    const stars = '⭐'.repeat(data.rating);

    if (data.serviceId) {
      const [serviceDetails] = await this.db.select().from(services).where(eq(services.id, data.serviceId)).limit(1);
      if (serviceDetails) {
        await this.notificationsService.create(
          serviceDetails.professionalId,
          'system',
          'Nova Avaliação de Serviço!',
          `Seu serviço "${serviceDetails.name}" recebeu ${data.rating} estrelas! ${stars}`,
          '/dashboard/avaliacoes' 
        );
      }
    } 
    else if (data.merchantId) {
      await this.notificationsService.create(
        data.merchantId, 
        'system',
        'Sua Loja foi avaliada!',
        `Você recebeu uma avaliação de ${data.rating} estrelas! ${stars}`,
        '/dashboard/avaliacoes' 
      );
    }
    else if (data.driverId) {
      await this.notificationsService.create(
        data.driverId, 
        'system',
        'Avaliação de Corrida!',
        `Você recebeu uma avaliação de ${data.rating} estrelas por uma entrega! ${stars}`,
        '/painel/entregador' 
      );
    }
    else if (data.productId) {
      const [productDetails] = await this.db.select().from(products).where(eq(products.id, data.productId)).limit(1);
      if (productDetails) {
        await this.notificationsService.create(
          productDetails.merchantId,
          'system',
          'Avaliação de Produto!',
          `O produto "${productDetails.name}" recebeu ${data.rating} estrelas! ${stars}`,
          '/dashboard/produtos' 
        );
      }
    }

    return review;
  }

  async findByTarget(targetField: 'serviceId' | 'merchantId' | 'driverId' | 'productId', targetId: string) {
    return await this.db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        comment: reviews.comment,
        createdAt: reviews.createdAt,
        authorName: users.name,
        authorAvatar: users.avatar, 
      })
      .from(reviews)
      .innerJoin(users, eq(reviews.authorId, users.id))
      .where(eq(reviews[targetField], targetId))
      .orderBy(desc(reviews.createdAt));
  }

  async getAverageRating(targetField: 'serviceId' | 'merchantId' | 'driverId' | 'productId', targetId: string) {
    const [result] = await this.db
        .select({ 
            average: sql<number>`avg(${reviews.rating})::numeric(10,1)`,
            count: sql<number>`count(*)` 
        })
        .from(reviews)
        .where(eq(reviews[targetField], targetId));
    
    return result || { average: 0, count: 0 };
  }
}