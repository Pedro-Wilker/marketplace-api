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

  /**
   * Cliente entra em uma conversa (room)
   * Envia o histórico recente das mensagens
   */
  @SubscribeMessage('joinConversation')
  async handleJoinConversation(
    @MessageBody() payload: { room: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!client.data.user) {
      client.emit('error', { message: 'Não autenticado' });
      return;
    }

    const room = payload.room;
    if (!room) {
      client.emit('error', { message: 'Room é obrigatória' });
      return;
    }

    const participants = room.startsWith('chat_')
      ? room.replace('chat_', '').split('_')
      : [];

    if (participants.length === 2 && !participants.includes(client.data.user.sub)) {
      client.emit('error', { message: 'Você não tem permissão para entrar nesta conversa' });
      return;
    }

    client.join(room);
    this.logger.log(`User ${client.data.user.sub} entrou na room: ${room}`);

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

    client.emit('joinedConversation', { room, userId: client.data.user.sub });
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

    if (!room || !content?.trim()) {
      client.emit('error', { message: 'Room e conteúdo são obrigatórios' });
      return;
    }

    const trimmedContent = content.trim();

    const [savedMessage] = await this.db
      .insert(messages)
      .values({
        room,
        senderId: client.data.user.sub,
        content: trimmedContent,
      })
      .returning();

    this.server.to(room).emit('newMessage', {
      id: savedMessage.id,
      senderId: client.data.user.sub,
      content: trimmedContent,
      timestamp: savedMessage.timestamp,
    });
  }

  /**
   * Indicador de "digitando..." 
   */
  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() payload: { room: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!client.data.user) return;
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