import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import { messages, users } from '../db/schema';
import { eq, asc } from 'drizzle-orm';

@Injectable()
export class ChatService {
  constructor(@Inject('DRIZZLE') private readonly db: NodePgDatabase<typeof schema>) {}

  async saveMessage(senderId: string, requestId: string, content: string) {
    const [newMessage] = await this.db
      .insert(messages)
      .values({
        senderId,
        requestId, // Compatível com schema.ts
        content,
      })
      .returning();
    
    const [sender] = await this.db.select().from(users).where(eq(users.id, senderId));

    return {
      ...newMessage,
      senderName: sender?.name || 'Usuário',
      // Mapeia createdAt (do banco) para ser usado no front
      createdAt: newMessage.createdAt, 
    };
  }

  async getHistory(requestId: string) {
    return await this.db
      .select({
        id: messages.id,
        content: messages.content,
        senderId: messages.senderId,
        createdAt: messages.createdAt, // Compatível com schema.ts
        senderName: users.name,
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.requestId, requestId)) // Compatível com schema.ts
      .orderBy(asc(messages.createdAt)); // Compatível com schema.ts
  }
}