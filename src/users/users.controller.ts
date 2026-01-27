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
  UsePipes,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';

import { CreateMerchantDto } from './dto/create-merchant.dto';
import { BecomePrefectureDto } from './dto/become-prefecture.dto';
import { BecomeProfessionalDto } from './dto/become-professional.dto';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get('test')
  async testConnection() {
    const allUsers = await this.usersService.findAll(10, 0);
    return {
      message: 'Conexão com Drizzle + PostgreSQL funcionando!',
      usersCount: allUsers.length,
      sample: allUsers,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    return user;
  }

  @Post()
  @UsePipes(new ZodValidationPipe(CreateUserDto)) 
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: any) {
    const updated = await this.usersService.update(id, updateUserDto);
    if (!updated) {
      throw new NotFoundException('Usuário não encontrado');
    }
    return updated;
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const deleted = await this.usersService.remove(id);
    if (!deleted) {
      throw new NotFoundException('Usuário não encontrado');
    }
    return { message: 'Usuário desativado com sucesso' };
  }

  @Post('become-merchant')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ZodValidationPipe(CreateMerchantDto))
  async becomeMerchant(@Req() req, @Body() data: CreateMerchantDto) {
    return this.usersService.becomeMerchant(req.user.sub, data);
  }

  @Post('become-prefecture')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ZodValidationPipe(BecomePrefectureDto))
  async becomePrefecture(@Req() req, @Body() data: BecomePrefectureDto) {
    return this.usersService.becomePrefecture(req.user.sub, data);
  }

  @Post('become-professional')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ZodValidationPipe(BecomeProfessionalDto))
  async becomeProfessional(@Req() req, @Body() data: BecomeProfessionalDto) {
    return this.usersService.becomeProfessional(req.user.sub, data);
  }
}