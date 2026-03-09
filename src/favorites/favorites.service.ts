import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import { favorites, merchantProfiles, professionalProfiles, products, services, users } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { ToggleFavoriteDto } from './dto/toggle-favorite.dto';

@Injectable()
export class FavoritesService {
  constructor(
    @Inject('DRIZZLE') private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async toggle(userId: string, data: ToggleFavoriteDto) {
    // 1. Mapeia o tipo para a coluna correta do banco de dados
    const columnMap = {
      merchant: favorites.merchantId,
      professional: favorites.professionalId,
      service: favorites.serviceId,
      product: favorites.productId,
    };
    const targetColumn = columnMap[data.type];

    // 2. Verifica se já existe nos favoritos
    const [existing] = await this.db
      .select()
      .from(favorites)
      .where(
        and(
          eq(favorites.userId, userId),
          eq(favorites.type, data.type),
          eq(targetColumn, data.targetId)
        )
      )
      .limit(1);

    // 3. Se existe, remove (Un-favorite)
    if (existing) {
      await this.db.delete(favorites).where(eq(favorites.id, existing.id));
      return { message: 'Removido dos favoritos', isFavorite: false };
    }

    // 4. Se não existe, adiciona (Favorite)
    const insertData: any = {
      userId,
      type: data.type,
    };
    
    // Injeta dinamicamente a chave estrangeira certa (ex: insertData.productId = data.targetId)
    const fkName = `${data.type}Id`; 
    insertData[fkName] = data.targetId;

    await this.db.insert(favorites).values(insertData);

    return { message: 'Adicionado aos favoritos', isFavorite: true };
  }

  // =================================================================
  // CONSULTAS POLIMÓRFICAS (Trazendo os dados ricos de cada tipo)
  // =================================================================
  
  async findMyFavorites(userId: string, type: 'merchant' | 'professional' | 'service' | 'product') {
    const baseQuery = this.db.select().from(favorites).where(and(eq(favorites.userId, userId), eq(favorites.type, type))).orderBy(desc(favorites.createdAt));

    // Dependendo do que o usuário quer listar, fazemos Joins diferentes para trazer o nome e a foto da entidade
    switch (type) {
      case 'merchant':
        return await this.db
          .select({
            favoriteId: favorites.id,
            merchantId: merchantProfiles.userId,
            businessName: merchantProfiles.businessName,
            avatar: users.avatar,
            createdAt: favorites.createdAt,
          })
          .from(favorites)
          .innerJoin(merchantProfiles, eq(favorites.merchantId, merchantProfiles.userId))
          .innerJoin(users, eq(merchantProfiles.userId, users.id))
          .where(and(eq(favorites.userId, userId), eq(favorites.type, type)))
          .orderBy(desc(favorites.createdAt));

      case 'product':
        return await this.db
          .select({
            favoriteId: favorites.id,
            productId: products.id,
            name: products.name,
            price: products.price,
            images: products.images,
            isAvailable: products.isAvailable,
            createdAt: favorites.createdAt,
          })
          .from(favorites)
          .innerJoin(products, eq(favorites.productId, products.id))
          .where(and(eq(favorites.userId, userId), eq(favorites.type, type)))
          .orderBy(desc(favorites.createdAt));

      case 'service':
        return await this.db
          .select({
            favoriteId: favorites.id,
            serviceId: services.id,
            name: services.name,
            price: services.price,
            image: services.image,
            createdAt: favorites.createdAt,
          })
          .from(favorites)
          .innerJoin(services, eq(favorites.serviceId, services.id))
          .where(and(eq(favorites.userId, userId), eq(favorites.type, type)))
          .orderBy(desc(favorites.createdAt));

      case 'professional':
        return await this.db
          .select({
            favoriteId: favorites.id,
            professionalId: professionalProfiles.userId,
            name: users.name,
            avatar: users.avatar,
            createdAt: favorites.createdAt,
          })
          .from(favorites)
          .innerJoin(professionalProfiles, eq(favorites.professionalId, professionalProfiles.userId))
          .innerJoin(users, eq(professionalProfiles.userId, users.id))
          .where(and(eq(favorites.userId, userId), eq(favorites.type, type)))
          .orderBy(desc(favorites.createdAt));
    }
  }
}