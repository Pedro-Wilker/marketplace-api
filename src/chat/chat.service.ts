import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import { messages, users, serviceRequests, services } from '../db/schema';
import { eq, asc } from 'drizzle-orm';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ChatService {
  constructor(
    @Inject('DRIZZLE') private readonly db: NodePgDatabase<typeof schema>,
    private readonly notificationsService: NotificationsService
  ) { }

  async saveMessage(senderId: string, requestId: string, content: string) {
    const [newMessage] = await this.db
      .insert(messages)
      .values({
        senderId,
        requestId,
        content,
      })
      .returning();

    const [sender] = await this.db.select().from(users).where(eq(users.id, senderId));

    const [requestDetails] = await this.db
      .select({
        customerId: serviceRequests.customerId,
        providerId: serviceRequests.providerId,
        serviceName: services.name,
      })
      .from(serviceRequests)
      .innerJoin(services, eq(serviceRequests.serviceId, services.id))
      .where(eq(serviceRequests.id, requestId))
      .limit(1);

    if (requestDetails) {
      let recipientId = '';
      let link = '';

      if (senderId === requestDetails.customerId) {
        recipientId = requestDetails.providerId;
        link = `/dashboard/solicitacoes?requestId=${requestId}`;
      } else {
        recipientId = requestDetails.customerId;
        link = `/minhas-solicitacoes?requestId=${requestId}`;
      }

      await this.notificationsService.create(
        recipientId,
        'message',
        `Nova mensagem: ${requestDetails.serviceName}`,
        `${sender?.name || 'Usuário'}: ${content.substring(0, 40)}${content.length > 40 ? '...' : ''}`,
        link
      );
    }

    return {
      ...newMessage,
      senderName: sender?.name || 'Usuário',
      createdAt: newMessage.createdAt,
    };
  }

  async getHistory(requestId: string) {
    return await this.db
      .select({
        id: messages.id,
        content: messages.content,
        senderId: messages.senderId,
        createdAt: messages.createdAt,
        senderName: users.name,
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.requestId, requestId))
      .orderBy(asc(messages.createdAt));
  }
}