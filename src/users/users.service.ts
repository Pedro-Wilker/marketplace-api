import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import { merchantProfiles, users, prefectureProfiles, professionalProfiles } from '../db/schema';
import { eq, and, isNull, InferSelectModel, InferInsertModel } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';

import { CreateMerchantDto } from './dto/create-merchant.dto';
import { BecomePrefectureDto } from './dto/become-prefecture.dto';
import { BecomeProfessionalDto } from './dto/become-professional.dto';
import { CreateUserDto } from './dto/create-user.dto'; 

type User = InferSelectModel<typeof users>;
type NewUser = InferInsertModel<typeof users>; 
type MerchantProfile = InferSelectModel<typeof merchantProfiles>;
type ProfessionalProfile = InferSelectModel<typeof professionalProfiles>;
type PrefectureProfile = InferSelectModel<typeof prefectureProfiles>;

@Injectable()
export class UsersService {
  constructor(
    @Inject('DRIZZLE') private readonly db: NodePgDatabase<typeof schema>,
  ) { }

  async findAll(limit: number = 50, offset: number = 0): Promise<User[]> {
    return await this.db
      .select()
      .from(users)
      .where(isNull(users.deletedAt)) 
      .limit(limit)
      .offset(offset);
  }

  async findOne(id: string): Promise<User | null> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(
        and(
          eq(users.id, id),
          isNull(users.deletedAt) 
        )
      )
      .limit(1);

    return user ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(
        and(
          eq(users.email, email),
          isNull(users.deletedAt)
        )
      )
      .limit(1);

    return user ?? null;
  }

  async create(data: CreateUserDto): Promise<User> {
    const existingUser = await this.findByEmail(data.email);
    if (existingUser) {
      throw new BadRequestException('Email já está em uso.');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const [newUser] = await this.db
      .insert(users)
      .values({
        name: data.name,
        email: data.email,
        passwordHash: passwordHash,
        phone: data.phone,
        cpfCnpj: data.cpfCnpj,
        type: data.type,
      })
      .returning();

    if (!newUser) {
      throw new Error('Falha ao criar usuário');
    }

    const { passwordHash: _, ...userWithoutPassword } = newUser;
    return userWithoutPassword as User;
  }

  async update(id: string, data: Partial<NewUser>): Promise<User | null> {
    const [updatedUser] = await this.db
      .update(users)
      .set({ 
        ...data, 
        updatedAt: new Date() 
      })
      .where(eq(users.id, id))
      .returning();

    return updatedUser ?? null;
  }

  async remove(id: string): Promise<boolean> {
    const [deletedUser] = await this.db
      .update(users)
      .set({ 
        deletedAt: new Date(),
        isActive: false 
      })
      .where(eq(users.id, id))
      .returning();

    return !!deletedUser;
  }

  async becomeMerchant(userId: string, data: CreateMerchantDto): Promise<MerchantProfile> {
    return await this.db.transaction(async (tx) => {
      const [user] = await tx.select().from(users).where(eq(users.id, userId)).limit(1);
      
      if (!user) throw new NotFoundException('Usuário não encontrado');
      if (user.type !== 'customer') throw new BadRequestException('Usuário já possui um perfil definido');

      const [merchantProfile] = await tx
        .insert(merchantProfiles)
        .values({
          userId: userId,
          businessName: data.businessName,
          cnpj: data.cnpj,
          categoryId: data.categoryId,
          openingHours: data.openingHours,
          minimumOrder: data.minimumOrder?.toString(),
          deliveryFee: data.deliveryFee?.toString(),
          location: data.location, 
        })
        .returning();

      await tx
        .update(users)
        .set({ type: 'merchant', updatedAt: new Date() })
        .where(eq(users.id, userId));

      return merchantProfile;
    });
  }

  async becomePrefecture(userId: string, data: BecomePrefectureDto): Promise<PrefectureProfile> {
    return await this.db.transaction(async (tx) => {
      const [user] = await tx.select().from(users).where(eq(users.id, userId)).limit(1);
      
      if (!user) throw new NotFoundException('Usuário não encontrado');
      if (user.type !== 'customer') throw new BadRequestException('Usuário já possui um perfil definido');

      const [prefectureProfile] = await tx
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

      await tx
        .update(users)
        .set({ type: 'prefecture', updatedAt: new Date() })
        .where(eq(users.id, userId));

      return prefectureProfile;
    });
  }

  async becomeProfessional(userId: string, data: BecomeProfessionalDto): Promise<ProfessionalProfile> {
    return await this.db.transaction(async (tx) => {
      const [user] = await tx.select().from(users).where(eq(users.id, userId)).limit(1);
      
      if (!user) throw new NotFoundException('Usuário não encontrado');
      if (user.type !== 'customer') throw new BadRequestException('Usuário já possui um perfil definido');

      const [professionalProfile] = await tx
        .insert(schema.professionalProfiles)
        .values({
          userId,
          categories: data.categories,
          serviceRadiusKm: data.serviceRadiusKm,
          portfolio: data.portfolio || [],
        })
        .returning();

      await tx
        .update(users)
        .set({ type: 'professional', updatedAt: new Date() })
        .where(eq(users.id, userId));

      return professionalProfile;
    });
  }
}