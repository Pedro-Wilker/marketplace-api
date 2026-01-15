import { Injectable } from '@nestjs/common';
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
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        {
          folder: this.configService.get<string>('CLOUDINARY_FOLDER') || 'marketplace',
          resource_type: 'image',
        },
        (error, result) => {
          if (error) return reject(error);
          if (!result) return reject(new Error('Upload failed: no result returned'));
          resolve(result.secure_url);
        },
      );

      upload.end(file.buffer);
    });
  }

  async uploadMultipleImages(files: Express.Multer.File[]): Promise<string[]> {
    const urls = await Promise.all(
      files.map(file => this.uploadImage(file)),
    );
    return urls;
  }
}