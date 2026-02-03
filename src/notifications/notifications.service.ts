import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import { notifications } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

@Injectable()
export class NotificationsService {
  constructor(@Inject('DRIZZLE') private readonly db: NodePgDatabase<typeof schema>) {}

  async create(userId: string, type: 'message' | 'request_new' | 'request_update' | 'system', title: string, content: string, link?: string) {
    await this.db.insert(notifications).values({
      userId,
      type,
      title,
      content,
      link
    });
  }

  async findAll(userId: string) {
    return await this.db.select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(20);
  }

  async markAsRead(id: string, userId: string) {
    await this.db.update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id)); 
  }
  
  async markAllRead(userId: string) {
      await this.db.update(notifications)
      .set({ read: true })
      .where(eq(notifications.userId, userId));
  }
}