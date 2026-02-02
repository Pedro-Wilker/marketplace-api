import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ServiceRequestsService } from './service-requests.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Controller, Post, Get, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';

@ApiTags('Solicitações de Serviço')
@Controller('service-requests')
export class ServiceRequestsController {
  constructor(private readonly requestsService: ServiceRequestsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Solicitar um serviço' })
  create(@Req() req, @Body() dto: CreateRequestDto) {
    return this.requestsService.create(req.user.sub, dto);
  }

  @Get('received')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Listar solicitações recebidas (Prestador)' })
  findAllReceived(@Req() req) {
    return this.requestsService.findAllReceived(req.user.sub);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Atualizar status da solicitação' })
  updateStatus(
    @Req() req, 
    @Param('id') id: string, 
    @Body('status') status: 'pending' | 'accepted' | 'rejected' | 'completed'
  ) {
    return this.requestsService.updateStatus(req.user.sub, id, status);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Listar minhas solicitações (Cliente)' })
  findAllByCustomer(@Req() req) {
    return this.requestsService.findAllByCustomer(req.user.sub);
  }
}