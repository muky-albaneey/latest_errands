import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios'; // Import HttpModule
import { User } from './entities/auth.entity';
import { Card } from './entities/card.entity';
import { DiverLicense } from './entities/license.entity';
import { Nin } from './entities/drive.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Card, DiverLicense, Nin]),
    ConfigModule,
    HttpModule, // Add HttpModule here
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('ACCESS_TOKEN'),
        signOptions: { expiresIn: '60s' },
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [TypeOrmModule, HttpModule], // Export HttpModule if needed in other modules
  controllers: [AuthController],
  providers: [AuthService], // Remove HttpService from providers
})
export class AuthModule {}
