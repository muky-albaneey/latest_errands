/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule, HttpService } from '@nestjs/axios'; // Import HttpModule
import { User } from './entities/user.entity';
import { Card } from './entities/card.entity';
import { DiverLicense } from './entities/license.entity';
import { Nin } from './entities/nin';
import { LocationDrive } from '../trip/entities/location_drive';
import { Vehicle } from './entities/vehicle.entity';
import { ProfileImage } from './entities/profile.entity';
import { plateNum } from './entities/plateNum.entity';
import { LicenseImg } from './entities/licenseImg.entity';
import { VehicleReg } from './entities/VehicleReg.entity';


@Module({
  imports: [
    TypeOrmModule.forFeature([User, Card, DiverLicense, Nin, LocationDrive, Vehicle, ProfileImage, plateNum, LicenseImg, VehicleReg, ]),
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
  exports: [TypeOrmModule, HttpModule,  AuthService, JwtModule], // Export HttpModule if needed in other modules
  controllers: [AuthController],
  providers: [AuthService], // Remove HttpService from providers
})
export class AuthModule {}

