import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token?.split(' ')[1];
      if (!token) throw new Error('Token ausente');

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_SECRET'),
      });

      client.data.user = payload;
      console.log(`Cliente conectado: ${payload.sub}`);
    } catch (e) {
      client.disconnect();
    }
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() requestId: string) {
    // Aqui usamos o requestId como nome da sala
    client.join(requestId);
    console.log(`Usuário entrou na sala: ${requestId}`);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { requestId: string; content: string },
  ) {
    const userId = client.data.user.sub;
    
    // Chama o serviço passando os nomes corretos
    const savedMessage = await this.chatService.saveMessage(
      userId, 
      payload.requestId, 
      payload.content
    );

    // Emite para a sala requestId
    this.server.to(payload.requestId).emit('newMessage', savedMessage);
  }
}