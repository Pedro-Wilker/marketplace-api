import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import helmet from 'helmet'; 

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet()); 
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*', 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });
 app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI, 
    defaultVersion: '1',
  });

 app.useGlobalPipes(new ValidationPipe({
    whitelist: true, 
    forbidNonWhitelisted: true, 
    transform: true, 
  }));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();