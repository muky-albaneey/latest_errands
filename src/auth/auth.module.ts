/* eslint-disable prettier/prettier */

import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from './entities/auth.entity';
import { Card } from './entities/card.entity';
import { DiverLicense } from './entities/license.entity';
import { Nin } from './entities/drive.entity';
import { HttpService } from '@nestjs/axios';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Card,DiverLicense, Nin]),
    ConfigModule, 
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('ACCESS_TOKEN'),
        signOptions: { expiresIn: '60s' },
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [TypeOrmModule],
  controllers: [AuthController],
  providers: [AuthService, HttpService],
})
export class AuthModule {}
