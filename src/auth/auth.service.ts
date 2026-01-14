import { Injectable, BadRequestException, UnauthorizedException, Inject, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { compare, hash } from 'bcrypt';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import { users, refreshTokens } from '../db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { InferSelectModel } from 'drizzle-orm';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

type User = InferSelectModel<typeof users>;

@Injectable()
export class AuthService {
  constructor(
    @Inject('DRIZZLE') private readonly db: NodePgDatabase<typeof schema>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) { }

  async register(data: RegisterDto): Promise<{ user: Partial<User>; accessToken: string }> {
    const existing = await this.db
      .select()
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1);

    if (existing.length > 0) {
      throw new BadRequestException('E-mail já cadastrado');
    }

    const passwordHash = await hash(data.password, 10);

    const [newUser] = await this.db
      .insert(users)
      .values({
        email: data.email,
        name: data.name,
        passwordHash,
        phone: data.phone,
        cpfCnpj: data.cpfCnpj,
        type: data.type,
      })
      .returning();

    const accessToken = this.jwtService.sign({
      sub: newUser.id,
      email: newUser.email,
      type: newUser.type,
    });

    return {
      user: { id: newUser.id, email: newUser.email, name: newUser.name, type: newUser.type },
      accessToken,
    };
  }

  async login(data: LoginDto): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.db
      .select()
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1);

    if (user.length === 0) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const [foundUser] = user;

    const passwordValid = await compare(data.password, foundUser.passwordHash || '');
    if (!passwordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const accessToken = this.jwtService.sign(
      { sub: foundUser.id, email: foundUser.email, type: foundUser.type },
      { expiresIn: '1d' },
    );

    const refreshToken = this.jwtService.sign(
      { sub: foundUser.id },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: '30d',
      },
    );

    await this.db.insert(refreshTokens).values({
      userId: foundUser.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    return { accessToken, refreshToken };
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch (e) {
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }

    const stored = await this.db
      .select()
      .from(refreshTokens)
      .where(
        and(
          eq(refreshTokens.token, refreshToken),
          eq(refreshTokens.userId, payload.sub),
          isNull(refreshTokens.revokedAt),
        ),
      )
      .limit(1);

    if (stored.length === 0) {
      throw new UnauthorizedException('Refresh token inválido ou revogado');
    }

    const accessToken = this.jwtService.sign({
      sub: payload.sub,
      email: payload.email,
      type: payload.type,
    });

    return { accessToken };
  }

  async changePassword(userId: string, data: ChangePasswordDto): Promise<{ message: string }> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const passwordValid = await compare(data.currentPassword, user.passwordHash || '');
    if (!passwordValid) {
      throw new BadRequestException('Senha atual incorreta');
    }

    const newHash = await hash(data.newPassword, 10);

    await this.db
      .update(users)
      .set({ passwordHash: newHash })
      .where(eq(users.id, userId));

    return { message: 'Senha alterada com sucesso' };
  }

  async forgotPassword(data: ForgotPasswordDto): Promise<{ message: string }> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1);

    if (!user) {
      return { message: 'Se o e-mail existir, você receberá um link de recuperação' };
    }

    const resetToken = this.jwtService.sign(
      { sub: user.id },
      { expiresIn: '1h' },
    );

    return { message: 'Link de recuperação enviado para o e-mail' };
  }

  async resetPassword(data: ResetPasswordDto): Promise<{ message: string }> {
    let payload: any;
    try {
      payload = this.jwtService.verify(data.token, {
        secret: this.configService.get('JWT_SECRET'),
      });
    } catch {
      throw new BadRequestException('Token de reset inválido ou expirado');
    }

    const newHash = await hash(data.newPassword, 10);

    await this.db
      .update(users)
      .set({ passwordHash: newHash })
      .where(eq(users.id, payload.sub));

    return { message: 'Senha redefinida com sucesso' };
  }
}