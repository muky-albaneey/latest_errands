/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { User } from './auth/entities/auth.entity';
import { Card } from './auth/entities/card.entity';
import { SmsModule } from './sms/sms.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal : true
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DATABASE_HOST'),
        // host: configService.get<string>('DATABASE_DEV_HOST') || 'db', // Use 'db' as the default
        port: configService.get<number>('DATABASE_PORT'),
        username: configService.get<string>('DATABASE_USERNAME'),
        password: configService.get<string>('DATABASE_PASSWORD'),
        database: configService.get<string>('DATABASE_NAME'),
        entities: [User, Card],
        synchronize: true,
        extra: {
          max: 2 // Limit to 2 connections
        }
        // migrations: ['src/migrations/*.ts'],
      }),
    }),
    AuthModule,
    SmsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}