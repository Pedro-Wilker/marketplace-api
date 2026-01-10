import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';

type User = InferSelectModel<typeof users>;
type NewUser = InferInsertModel<typeof users>;

@Injectable()
export class UsersService {
  constructor(
    @Inject('DRIZZLE') private readonly db: NodePgDatabase<typeof schema>,
  ) {}


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
}