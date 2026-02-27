import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Helmet with permissive CSP for model-viewer and AR on mobile Safari
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://ajax.googleapis.com', 'https://unpkg.com', 'blob:'],
          scriptSrcAttr: ["'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
          connectSrc: ["'self'", 'https:', 'http:', 'ws:', 'wss:'],
          mediaSrc: ["'self'", 'blob:'],
          workerSrc: ["'self'", 'blob:'],
          childSrc: ["'self'", 'blob:'],
          frameSrc: ["'self'", 'blob:', 'https:'],
          fontSrc: ["'self'", 'data:', 'https:'],
        },
      },
    }),
  );

  app.use(cookieParser());

  // CORS: allow dashboard origin with credentials + permissive for viewer/embed
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      // Allow configured app URL
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      if (origin === appUrl) return callback(null, true);
      // Allow any origin for viewer/embed (public endpoints)
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Api-Key'],
  });

  app.setGlobalPrefix('api', { exclude: ['v/:companySlug/:sku', 'embed.js', 'health', 'uploads/(.*)'] });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = process.env.API_PORT || 4000;
  await app.listen(port, '0.0.0.0');
  console.log(`AR-Core API running on http://0.0.0.0:${port}`);
}
bootstrap();
