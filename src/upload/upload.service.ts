import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadService {
  // O process.cwd() garante que a pasta 'uploads' fique na raiz do projeto ~/apps/marketplace-api/uploads
  private readonly uploadPath = path.join(process.cwd(), 'uploads');

  constructor(private configService: ConfigService) {
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  async uploadImage(file: Express.Multer.File): Promise<string> {
    if (!file) throw new BadRequestException('Arquivo não fornecido');

    const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    const fullPath = path.join(this.uploadPath, fileName);

    try {
      fs.writeFileSync(fullPath, file.buffer);
      
      // Busca a APP_URL do seu .env (ex: http://localhost:3000 ou https://api.artonbyte.com.br)
      const baseUrl = this.configService.get<string>('APP_URL') || 'http://localhost:3000';
      return `${baseUrl.replace(/\/$/, '')}/uploads/${fileName}`;
    } catch (error) {
      throw new BadRequestException('Erro ao salvar arquivo no servidor local');
    }
  }

  async uploadMultipleImages(files: Express.Multer.File[]): Promise<string[]> {
    return Promise.all(files.map(file => this.uploadImage(file)));
  }
}