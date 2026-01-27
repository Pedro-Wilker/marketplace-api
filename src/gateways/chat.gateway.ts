import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger, Inject } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import { messages } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger = new Logger('ChatGateway');

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    @Inject('DRIZZLE') private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  afterInit() {
    this.logger.log('WebSocket Gateway inicializado com sucesso');
  }

  private validateRoomAccess(room: string, userId: string): boolean {
    if (!room) return false;
    if (room.startsWith('chat_')) {
      const participants = room.replace('chat_', '').split('_');
      return participants.includes(userId);
    }
    return true; 
  }

  async handleConnection(client: Socket) {
    const token =
      client.handshake.auth.token || (client.handshake.query.token as string);

    if (!token) {
      this.logger.warn(`Conexão recusada: token não fornecido - ${client.id}`);
      client.disconnect();
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      client.data.user = payload;
      this.logger.log(`Cliente autenticado: ${client.id} | userId: ${payload.sub}`);
    } catch (error) {
      this.logger.warn(`Token inválido para cliente ${client.id}: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente desconectado: ${client.id}`);
  }

  @SubscribeMessage('joinConversation')
  async handleJoinConversation(
    @MessageBody() payload: { room: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!client.data.user) {
      client.emit('error', { message: 'Não autenticado' });
      return;
    }

    const { room } = payload;
    const userId = client.data.user.sub;

    if (!this.validateRoomAccess(room, userId)) {
      client.emit('error', { message: 'Você não tem permissão para entrar nesta conversa' });
      return;
    }

    client.join(room);
    this.logger.log(`User ${userId} entrou na room: ${room}`);

    const history = await this.db
      .select({
        id: messages.id,
        senderId: messages.senderId,
        content: messages.content,
        timestamp: messages.timestamp,
      })
      .from(messages)
      .where(eq(messages.room, room))
      .orderBy(desc(messages.timestamp))
      .limit(50);

    client.emit('conversationHistory', history.reverse());
    client.emit('joinedConversation', { room, userId });
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() payload: { room: string; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!client.data.user) {
      client.emit('error', { message: 'Não autenticado' });
      return;
    }

    const { room, content } = payload;
    const userId = client.data.user.sub;

    if (!room || !content?.trim()) {
      client.emit('error', { message: 'Room e conteúdo são obrigatórios' });
      return;
    }

    if (!this.validateRoomAccess(room, userId)) {
      this.logger.warn(`Tentativa de injeção de mensagem na sala ${room} pelo user ${userId}`);
      client.emit('error', { message: 'Acesso negado à sala' });
      return; 
    }

    const safeContent = content.trim()
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    const [savedMessage] = await this.db
      .insert(messages)
      .values({
        room,
        senderId: userId,
        content: safeContent,
      })
      .returning();

    this.server.to(room).emit('newMessage', {
      id: savedMessage.id,
      senderId: userId,
      content: safeContent,
      timestamp: savedMessage.timestamp,
    });
  }

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() payload: { room: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!client.data.user) return;
    
    if (!this.validateRoomAccess(payload.room, client.data.user.sub)) return;

    this.server.to(payload.room).emit('userTyping', {
      userId: client.data.user.sub,
      room: payload.room,
      isTyping: true,
    });
  }

  @SubscribeMessage('stopTyping')
  handleStopTyping(
    @MessageBody() payload: { room: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!client.data.user) return;
    this.server.to(payload.room).emit('userTyping', {
      userId: client.data.user.sub,
      room: payload.room,
      isTyping: false,
    });
  }
}