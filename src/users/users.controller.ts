import { Controller, Get } from '@nestjs/common';
import { DrizzleService } from '../db/drizzle.service';  
import { users } from '../db/schema';
import { eq } from 'drizzle-orm'; 
@Controller('users')
export class UsersController {
  constructor(private readonly drizzle: DrizzleService) {}

  @Get('test')
  async testConnection() {
    const db = this.drizzle.dbInstance;

    const allUsers = await db.select().from(users).limit(10);

    return {
      message: 'Conexão com Drizzle + PostgreSQL funcionando!',
      usersCount: allUsers.length,
      sample: allUsers,
    };
  }
}