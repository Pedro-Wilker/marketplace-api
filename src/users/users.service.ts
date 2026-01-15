import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import { merchantProfiles, users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { BecomePrefectureDto } from './dto/become-prefecture.dto';
import { BecomeProfessionalDto } from './dto/become-professional.dto';

type User = InferSelectModel<typeof users>;
type NewUser = InferInsertModel<typeof users>;
type MerchantProfile = InferSelectModel<typeof merchantProfiles>;
type ProfessionalProfile = InferSelectModel<typeof schema.professionalProfiles>;
@Injectable()
export class UsersService {
  constructor(
    @Inject('DRIZZLE') private readonly db: NodePgDatabase<typeof schema>,
  ) { }

  async findAll(limit: number = 50, offset: number = 0): Promise<User[]> {
    return await this.db
      .select()
      .from(users)
      .limit(limit)
      .offset(offset);
  }

  async findOne(id: string): Promise<User | null> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return user ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return user ?? null;
  }

  async create(data: NewUser): Promise<User> {
    const [newUser] = await this.db
      .insert(users)
      .values(data)
      .returning();

    if (!newUser) {
      throw new Error('Falha ao criar usuário');
    }

    return newUser;
  }

  async update(id: string, data: Partial<NewUser>): Promise<User | null> {
    const [updatedUser] = await this.db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    return updatedUser ?? null;
  }


  async remove(id: string): Promise<boolean> {
    const result = await this.db
      .delete(users)
      .where(eq(users.id, id));

    return (result.rowCount ?? 0) > 0;
  }

  async becomeMerchant(userId: string, data: CreateMerchantDto): Promise<MerchantProfile> {
    const user = await this.findOne(userId);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (user.type !== 'customer') {
      throw new BadRequestException('Usuário já é merchant ou outro tipo');
    }

    const [merchantProfile] = await this.db
      .insert(merchantProfiles)
      .values({
        userId: userId,
        businessName: data.businessName,
        cnpj: data.cnpj,
        categoryId: data.categoryId,
        openingHours: data.openingHours,
        minimumOrder: data.minimumOrder?.toString(),
        deliveryFee: data.deliveryFee?.toString(),
      })
      .returning();

    await this.db
      .update(users)
      .set({ type: 'merchant' })
      .where(eq(users.id, userId));

    return merchantProfile;
  }

  async becomePrefecture(userId: string, data: BecomePrefectureDto): Promise<any> {
    const user = await this.findOne(userId);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (user.type !== 'customer') {
      throw new BadRequestException('Usuário já possui outro perfil');
    }

    const [prefectureProfile] = await this.db
      .insert(schema.prefectureProfiles)
      .values({
        userId,
        officialName: data.officialName,
        cnpj: data.cnpj,
        addressStreet: data.addressStreet,
        addressNumber: data.addressNumber,
        addressNeighborhood: data.addressNeighborhood,
        addressCity: data.addressCity,
        addressState: data.addressState,
        addressZipCode: data.addressZipCode,
        location: data.location,
        officialWebsite: data.officialWebsite,
        mainPhone: data.mainPhone,
        institutionalEmail: data.institutionalEmail,
        responsibleName: data.responsibleName,
        responsiblePosition: data.responsiblePosition,
        status: 'pending',
      })
      .returning();

    await this.db
      .update(users)
      .set({ type: 'prefecture' })
      .where(eq(users.id, userId));

    return prefectureProfile;
  }

  async becomeProfessional(userId: string, data: BecomeProfessionalDto): Promise<ProfessionalProfile> {
    const user = await this.findOne(userId);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (user.type !== 'customer') {
      throw new BadRequestException('Usuário já possui outro perfil');
    }

const [professionalProfile] = await this.db
    .insert(schema.professionalProfiles)
    .values({
      userId,
      categories: data.categories,
      serviceRadiusKm: data.serviceRadiusKm,
      portfolio: data.portfolio || [], 
    })
    .returning();

    await this.db
      .update(users)
      .set({ type: 'professional' })
      .where(eq(users.id, userId));

    return professionalProfile;
  }
}