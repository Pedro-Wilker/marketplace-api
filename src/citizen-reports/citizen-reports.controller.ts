import { Controller, Get, Post, Body, Patch, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CitizenReportsService } from './citizen-reports.service';
import { CreateReportDto, UpdateReportStatusDto } from './dto/create-report.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

@ApiTags('Ouvidoria / Zeladoria (Citizen Reports)')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('citizen-reports')
export class CitizenReportsController {
  constructor(private readonly reportsService: CitizenReportsService) {}

  @Post()
  @ApiOperation({ summary: 'Abrir um novo chamado na prefeitura' })
  async create(@Req() req, @Body() dto: CreateReportDto) {
    return this.reportsService.create(req.user.sub, dto);
  }

  @Get('my-reports')
  @ApiOperation({ summary: 'Listar todos os chamados abertos por mim' })
  async findMyReports(@Req() req) {
    return this.reportsService.findAllByCitizen(req.user.sub);
  }

  @Get('prefecture/inbox')
  @UseGuards(RolesGuard)
  @Roles('prefecture', 'admin')
  @ApiOperation({ summary: 'Caixa de entrada: Listar chamados recebidos pela prefeitura' })
  async findPrefectureReports(@Req() req) {
    return this.reportsService.findAllByPrefecture(req.user.sub);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('prefecture', 'admin')
  @ApiOperation({ summary: 'Atualizar o status de um chamado (Prefeitura)' })
  async updateStatus(
    @Req() req, 
    @Param('id') id: string, 
    @Body() dto: UpdateReportStatusDto
  ) {
    return this.reportsService.updateStatus(req.user.sub, id, dto);
  }
}