import { Injectable, Inject, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import { serviceRequests, services, users } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { CreateRequestDto } from './dto/create-request.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ServiceRequestsService {
  constructor(
    @Inject('DRIZZLE') private readonly db: NodePgDatabase<typeof schema>,
    private readonly notificationsService: NotificationsService
  ) { }

  async create(customerId: string, data: CreateRequestDto) {
    const [service] = await this.db
      .select()
      .from(services)
      .where(eq(services.id, data.serviceId))
      .limit(1);

    if (!service) throw new NotFoundException('Serviço não encontrado');
    if (service.professionalId === customerId) throw new BadRequestException('Você não pode solicitar seu próprio serviço');

    const [request] = await this.db
      .insert(serviceRequests)
      .values({
        customerId,
        serviceId: data.serviceId,
        providerId: service.professionalId,
        customerNote: data.customerNote,
        status: 'pending'
      })
      .returning();

    await this.notificationsService.create(
      request.providerId,
      'request_new',
      'Nova Solicitação!',
      `Você recebeu um novo pedido para o serviço: ${service.name}.`,
      '/dashboard/solicitacoes'
    );

    return request;
  }

  async findAllReceived(providerId: string) {
    const requests = await this.db
      .select({
        id: serviceRequests.id,
        status: serviceRequests.status,
        customerNote: serviceRequests.customerNote,
        createdAt: serviceRequests.createdAt,
        updatedAt: serviceRequests.updatedAt, 

        serviceId: services.id,
        serviceName: services.name,
        serviceDescription: services.description, 
        servicePrice: services.price,             
        servicePriceType: services.priceType,     

        customerId: users.id,
        customerName: users.name,
        customerPhone: users.phone,
        customerEmail: users.email,
        customerCity: users.city,                 
      })
      .from(serviceRequests)
      .innerJoin(services, eq(serviceRequests.serviceId, services.id))
      .innerJoin(users, eq(serviceRequests.customerId, users.id))
      .where(eq(serviceRequests.providerId, providerId))
      .orderBy(desc(serviceRequests.createdAt));

    return requests;
  }

  async updateStatus(providerId: string, requestId: string, status: 'pending' | 'accepted' | 'rejected' | 'completed') {
    const [request] = await this.db
      .select()
      .from(serviceRequests)
      .where(eq(serviceRequests.id, requestId))
      .limit(1);

    if (!request) throw new NotFoundException('Solicitação não encontrada');
    if (request.providerId !== providerId) throw new ForbiddenException('Você não tem permissão para alterar este pedido');

    const [updated] = await this.db
      .update(serviceRequests)
      .set({
        status,
        updatedAt: new Date()
      })
      .where(eq(serviceRequests.id, requestId))
      .returning();

    let statusMessage = '';
    switch (status) {
      case 'accepted': statusMessage = 'Seu pedido foi aceito e está em andamento.'; break;
      case 'completed': statusMessage = 'Seu serviço foi concluído! Não esqueça de avaliar.'; break;
      case 'rejected': statusMessage = 'Seu pedido foi recusado pelo prestador.'; break;
      default: statusMessage = `O status do seu pedido mudou para: ${status}`;
    }

    await this.notificationsService.create(
      updated.customerId,
      'request_update',
      'Atualização no Pedido',
      statusMessage,
      '/minhas-solicitacoes'
    );

    return updated;
  }

  async findAllByCustomer(customerId: string) {
    return await this.db
      .select({
        id: serviceRequests.id,
        serviceId: serviceRequests.serviceId,
        providerId: serviceRequests.providerId,

        status: serviceRequests.status,
        customerNote: serviceRequests.customerNote,
        createdAt: serviceRequests.createdAt,
        serviceName: services.name,
        providerName: users.name,
      })
      .from(serviceRequests)
      .innerJoin(services, eq(serviceRequests.serviceId, services.id))
      .innerJoin(users, eq(serviceRequests.providerId, users.id))
      .where(eq(serviceRequests.customerId, customerId))
      .orderBy(desc(serviceRequests.createdAt));
  }
}