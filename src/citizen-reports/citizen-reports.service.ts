import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import { citizenReports, users } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { CreateReportDto, UpdateReportStatusDto } from './dto/create-report.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CitizenReportsService {
  constructor(
    @Inject('DRIZZLE') private readonly db: NodePgDatabase<typeof schema>,
    private readonly notificationsService: NotificationsService
  ) {}

  async create(citizenId: string, data: CreateReportDto) {
    const [report] = await this.db
      .insert(citizenReports)
      .values({
        citizenId,
        prefectureId: data.prefectureId,
        category: data.category,
        description: data.description,
        imageUrl: data.imageUrl,
        lat: data.lat ? data.lat.toString() : null, 
        lng: data.lng ? data.lng.toString() : null,
        addressReference: data.addressReference,
        status: 'reported',
      })
      .returning();

    await this.notificationsService.create(
      data.prefectureId,
      'system',
      'Novo Chamado na Ouvidoria',
      `Um cidadão relatou um problema na categoria: ${data.category}.`,
      '/dashboard/ouvidoria'
    );

    return report;
  }

  async findAllByCitizen(citizenId: string) {
    return await this.db.query.citizenReports.findMany({
      where: eq(citizenReports.citizenId, citizenId),
      orderBy: [desc(citizenReports.createdAt)],
    });
  }

  async findAllByPrefecture(prefectureId: string) {
    return await this.db
      .select({
        id: citizenReports.id,
        category: citizenReports.category,
        description: citizenReports.description,
        imageUrl: citizenReports.imageUrl,
        lat: citizenReports.lat,
        lng: citizenReports.lng,
        addressReference: citizenReports.addressReference,
        status: citizenReports.status,
        adminNotes: citizenReports.adminNotes,
        createdAt: citizenReports.createdAt,
        updatedAt: citizenReports.updatedAt,
        
        citizenName: users.name,
        citizenPhone: users.phone,
      })
      .from(citizenReports)
      .innerJoin(users, eq(citizenReports.citizenId, users.id))
      .where(eq(citizenReports.prefectureId, prefectureId))
      .orderBy(desc(citizenReports.createdAt));
  }

  async updateStatus(prefectureId: string, reportId: string, data: UpdateReportStatusDto) {
    const [report] = await this.db.select().from(citizenReports).where(eq(citizenReports.id, reportId)).limit(1);

    if (!report) throw new NotFoundException('Chamado não encontrado.');
    if (report.prefectureId !== prefectureId) {
      throw new ForbiddenException('Você não tem permissão para atualizar os chamados de outra prefeitura.');
    }

    const [updated] = await this.db
      .update(citizenReports)
      .set({
        status: data.status,
        adminNotes: data.adminNotes || report.adminNotes,
        updatedAt: new Date(),
      })
      .where(eq(citizenReports.id, reportId))
      .returning();

    const statusMap = {
      'in_progress': 'Em andamento 🚧',
      'resolved': 'Resolvido ✅',
      'dismissed': 'Arquivado / Improcedente ❌'
    };

    if (data.status !== 'reported') {
      await this.notificationsService.create(
        updated.citizenId,
        'request_update',
        'Atualização no seu Chamado',
        `Seu relato sobre "${updated.category}" agora está: ${statusMap[data.status]}. ${data.adminNotes ? 'A prefeitura deixou uma nota para você.' : ''}`,
        '/meus-chamados'
      );
    }

    return updated;
  }
}