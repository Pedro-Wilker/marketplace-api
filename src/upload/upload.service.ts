import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class UploadService {
  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadImage(file: Express.Multer.File): Promise<string> {
   const { fileTypeFromBuffer } = await import('file-type');
    
    const type = await fileTypeFromBuffer(file.buffer);
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    
    if (!type || !allowedMimes.includes(type.mime)) {
      throw new BadRequestException('Arquivo inválido ou corrompido. Apenas JPG, PNG e WebP são permitidos.');
    }

    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        {
          folder: this.configService.get<string>('CLOUDINARY_FOLDER') || 'marketplace',
          resource_type: 'image',
          public_id: `${Date.now()}-${Math.round(Math.random() * 1e9)}`,
        },
        (error, result) => {
          if (error) return reject(new BadRequestException('Erro no upload para nuvem'));
          if (!result) return reject(new Error('Upload falhou sem resposta'));
          resolve(result.secure_url);
        },
      );
      upload.end(file.buffer);
    });
  }

  async uploadMultipleImages(files: Express.Multer.File[]): Promise<string[]> {
    const urls: string[] = [];
     for (const file of files) {
      urls.push(await this.uploadImage(file));
    }
    return urls;
  }
}