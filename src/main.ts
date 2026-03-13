import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { VersioningType } from '@nestjs/common';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ZodValidationPipe } from 'nestjs-zod';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path'; 

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // ==========================================================
  // 1. SEGURANÇA INTELIGENTE (HELMET)
  // ==========================================================
  if (process.env.NODE_ENV === 'production') {
    // Na nuvem: Segurança mais rígida, mas permitindo o carregamento de imagens no frontend
    app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  } else {
    // No PC (Localhost): Relaxa a segurança para facilitar os testes
    app.use(helmet({
      contentSecurityPolicy: false, 
      crossOriginResourcePolicy: false,
    }));
  }

  // ==========================================================
  // 2. CONFIGURAÇÃO DE CORS
  // ==========================================================
  app.enableCors({
    // Pega a lista do .env, se não existir, libera para geral '*'
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });

  // ==========================================================
  // 3. PASTA DE UPLOADS PÚBLICA
  // ==========================================================
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.useGlobalPipes(new ZodValidationPipe());

  // ==========================================================
  // 4. DOCUMENTAÇÃO (SWAGGER)
  // ==========================================================
  const config = new DocumentBuilder()
    .setTitle('Prefeitura Marketplace API')
    .setDescription('Documentação das rotas da API')
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      in: 'header'
    }, 'JWT-auth')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`Swagger Docs available at: ${await app.getUrl()}/docs`);
}
bootstrap();