import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import { categories } from '../db/schema';
import { eq } from 'drizzle-orm';
import { InferSelectModel } from 'drizzle-orm';

type Category = InferSelectModel<typeof categories>;

@Injectable()
export class CategoriesService {
    constructor(
        @Inject('DRIZZLE') private readonly db: NodePgDatabase<typeof schema>,
    ) { }

    async findAll(): Promise<Category[]> {
        return await this.db.select().from(categories);
    }

    async findOne(id: string): Promise<Category | null> {
        const [result] = await this.db
            .select()
            .from(categories)
            .where(eq(categories.id, id))
            .limit(1);

        return result ?? null;
    }

    async create(data: { name: string; parentId?: string; type: string }): Promise<Category> {
        const result = await this.db
            .insert(categories)
            .values(data)
            .returning();

        const newCategory = Array.isArray(result) ? result[0] : result;

        if (!newCategory) {
            throw new Error('Falha ao criar categoria: nenhum registro retornado');
        }

        return newCategory;
    }

    async update(id: string, data: Partial<{ name: string; parentId?: string }>): Promise<Category | null> {
        const [updated] = await this.db
            .update(categories)
            .set(data)
            .where(eq(categories.id, id))
            .returning();

        return updated ?? null;
    }

    async remove(id: string): Promise<{ message: string }> {
        await this.db.delete(categories).where(eq(categories.id, id));
        return { message: 'Categoria removida com sucesso' };
    }
}