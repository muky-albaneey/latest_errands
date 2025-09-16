/* eslint-disable prettier/prettier */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';
import * as express from 'express';

async function bootstrap() {
  dotenv.config();
  const app = await NestFactory.create(AppModule);

// Middleware to parse raw body for Stripe webhooks
// app.use('/orders/webhook', express.raw({ type: 'application/json' }));
// This captures raw body and attaches it to req.rawBody
app.use('/orders/webhook', express.raw({ type: 'application/json' }), (req, res, next) => {
  // Store raw body so we can access it in the controller
  (req as any).rawBody = req.body;
  next();
});
// app.use(json({
//   verify: (req: any, _res, buf) => { req.rawBody = buf; }
// }));



  // Default JSON body parser for other routes
  app.use(express.json());

  app.use(cookieParser());

  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  const configService = app.get(ConfigService);
  const PORT = configService.get<number>('PORT') || 3000;
  await app.listen(PORT, '0.0.0.0', () => {
    console.log(`Running in ${configService.get<string>('NODE_ENV')} on port ${PORT}`);
  });
}
bootstrap();
