import 'reflect-metadata';
import 'dotenv/config';

import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      process.env['CORS_ORIGIN'] ?? 'http://localhost:3000',
      'https://vibeloop-web.vercel.app',
    ],
    credentials: true,
  });

  const port = process.env['PORT'] ?? 4000;
  await app.listen(port);
  console.log(`API running on http://localhost:${port}`);
}

void bootstrap();
