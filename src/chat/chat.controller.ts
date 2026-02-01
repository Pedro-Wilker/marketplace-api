import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('history/:requestId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obter histórico de mensagens de um pedido' })
  getHistory(@Param('requestId') requestId: string) {
    return this.chatService.getHistory(requestId);
  }
}