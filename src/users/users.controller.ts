import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  NotFoundException,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { BecomePrefectureDto } from './dto/become-prefecture.dto';
import { BecomeProfessionalDto } from './dto/become-professional.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePrefectureDto } from './dto/update-prefecture.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@ApiTags('Usuários')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get('test')
  @ApiOperation({ summary: 'Teste de conexão com BD' })
  async testConnection() {
    const allUsers = await this.usersService.findAll(10, 0);
    return {
      message: 'Conexão com Drizzle + PostgreSQL funcionando!',
      usersCount: allUsers.length,
      sample: allUsers,
    };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get()
  @ApiOperation({ summary: 'Listar usuários' })
  async findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get(':id')
  @ApiOperation({ summary: 'Buscar usuário por ID' })
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    return user;
  }

  @Post()
  @ApiOperation({ summary: 'Criar usuário (Interno/Admin)' })
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar usuário' })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) { // Use o DTO
    const updated = await this.usersService.update(id, updateUserDto);
    if (!updated) {
      throw new NotFoundException('Usuário não encontrado');
    }
    return updated;
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Delete(':id')
  @ApiOperation({ summary: 'Desativar usuário (Soft Delete)' })
  async remove(@Param('id') id: string) {
    const deleted = await this.usersService.remove(id);
    if (!deleted) {
      throw new NotFoundException('Usuário não encontrado');
    }
    return { message: 'Usuário desativado com sucesso' };
  }

  @Get('prefecture/search')
  @ApiOperation({ summary: 'Buscar dados da prefeitura por cidade' })
  async findPrefectureByCity(@Query('city') city: string) {
    if (!city) throw new NotFoundException('Cidade é obrigatória');
    
    const prefecture = await this.usersService.findPrefectureByCity(city);
    
    if (!prefecture) {
 
      return null; 
    }
    return prefecture;
  }

  @Post('become-merchant')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Transformar usuário em Comerciante' })
  async becomeMerchant(@Req() req, @Body() data: CreateMerchantDto) {
    return this.usersService.becomeMerchant(req.user.sub, data);
  }

  @Post('become-prefecture')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Solicitar perfil de Prefeitura' })
  async becomePrefecture(@Req() req, @Body() data: BecomePrefectureDto) {
    return this.usersService.becomePrefecture(req.user.sub, data);
  }

  @Post('become-professional')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Transformar usuário em Profissional' })
  async becomeProfessional(@Req() req, @Body() data: BecomeProfessionalDto) {
    return this.usersService.becomeProfessional(req.user.sub, data);
  }

  @Patch('profile/prefecture')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('prefecture') 
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Atualizar dados do perfil da Prefeitura' })
  async updatePrefectureProfile(@Req() req, @Body() dto: UpdatePrefectureDto) {
    return this.usersService.updatePrefectureProfile(req.user.sub, dto);
  }

}