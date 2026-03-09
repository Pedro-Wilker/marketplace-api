import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import { announcements, prefectureProfiles } from '../db/schema';
import { eq, and, desc, sql, or, isNull, gt } from 'drizzle-orm';
import { CreateAnnouncementDto, UpdateAnnouncementDto } from './dto/create-announcement.dto';

@Injectable()
export class AnnouncementsService {
  constructor(
    @Inject('DRIZZLE') private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async create(userId: string, data: CreateAnnouncementDto) {
    const [prefecture] = await this.db.select().from(prefectureProfiles).where(eq(prefectureProfiles.userId, userId)).limit(1);
    
    if (!prefecture) {
      throw new ForbiddenException('Apenas prefeituras com perfil configurado podem criar anúncios.');
    }

    const [announcement] = await this.db
      .insert(announcements)
      .values({
        prefectureId: userId,
        targetCity: data.targetCity,
        title: data.title,
        content: data.content,
        type: data.type,
        imageUrl: data.imageUrl,
        actionLink: data.actionLink,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      })
      .returning();

    return announcement;
  }

  async findActiveFeedByCity(city: string) {
    return await this.db.query.announcements.findMany({
      where: and(
        eq(announcements.targetCity, city),
        eq(announcements.isActive, true),
        or(
          isNull(announcements.expiresAt),
          gt(announcements.expiresAt, new Date())
        )
      ),
      orderBy: [desc(announcements.createdAt)],
      with: {
      }
    });
  }

  async findAllByPrefecture(prefectureId: string) {
    return await this.db
      .select()
      .from(announcements)
      .where(eq(announcements.prefectureId, prefectureId))
      .orderBy(desc(announcements.createdAt));
  }

  async findOne(id: string) {
    const [announcement] = await this.db
      .select()
      .from(announcements)
      .where(eq(announcements.id, id))
      .limit(1);

    if (!announcement) throw new NotFoundException('Anúncio não encontrado.');
    return announcement;
  }

  async update(prefectureId: string, id: string, data: UpdateAnnouncementDto) {
    const announcement = await this.findOne(id);
    if (announcement.prefectureId !== prefectureId) {
      throw new ForbiddenException('Você não tem permissão para editar este anúncio.');
    }

    const [updated] = await this.db
      .update(announcements)
      .set({
        ...data,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      })
      .where(eq(announcements.id, id))
      .returning();

    return updated;
  }

  async remove(prefectureId: string, id: string) {
    const announcement = await this.findOne(id);
    if (announcement.prefectureId !== prefectureId) {
      throw new ForbiddenException('Você não tem permissão para excluir este anúncio.');
    }

    await this.db.delete(announcements).where(eq(announcements.id, id));
    return { message: 'Anúncio removido com sucesso.' };
  }
}