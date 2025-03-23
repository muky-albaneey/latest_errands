import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule, HttpService } from '@nestjs/axios'; // Import HttpModule
import { User } from './entities/auth.entity';
import { Card } from './entities/card.entity';
import { DiverLicense } from './entities/license.entity';
import { Nin } from './entities/nin';
import { LocationDrive } from './entities/location_drive';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Card, DiverLicense, Nin, LocationDrive]),
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
// @Module({
//   imports: [
//     TypeOrmModule.forFeature([User, Card, DiverLicense, Nin]),
//     ConfigModule.forRoot(), // Ensure ConfigModule is initialized
//     HttpModule, 
//     JwtModule.registerAsync({
//       imports: [ConfigModule],
//       useFactory: async (configService: ConfigService) => ({
//         secret: configService.get<string>('ACCESS_TOKEN'),
//         signOptions: { expiresIn: '60s' },
//       }),
//       inject: [ConfigService],
//     }),
//   ],
//   exports: [TypeOrmModule, HttpModule],
//   controllers: [AuthController],
//   providers: [
//     AuthService,
//     JwtService,
//     ConfigService,
//     HttpService,
//     {
//       provide: 'API_URL',
//       useValue: 'http://www.carqueryapi.com/api/0.3/',  // This might be redundant if you rely on ConfigService
//     },
//   ],
// })
// export class AuthModule {}
