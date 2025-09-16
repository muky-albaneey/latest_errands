/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { User } from './auth/entities/user.entity';
import { Card } from './auth/entities/card.entity';
import { SmsModule } from './sms/sms.module';
import { DiverLicense } from './auth/entities/license.entity';
import { Nin } from './auth/entities/nin';
import { LocationDrive } from './trip/entities/location_drive';
import { Vehicle } from './auth/entities/vehicle.entity';
import { ProfileImage } from './auth/entities/profile.entity';
import { plateNum } from './auth/entities/plateNum.entity';
import { LicenseImg } from './auth/entities/licenseImg.entity';
import { VehicleReg } from './auth/entities/VehicleReg.entity';
import { LocationModule } from './location/location.module';
import { TripModule } from './trip/trip.module';
import { Trip } from './trip/entities/trip.entity';
import { OrdersModule } from './orders/orders.module';
import { RidesModule } from './rides/rides.module';
import { ProductImg } from './orders/entities/productImg.entity';
import { Order } from './orders/entities/order.entity';
import { Ride } from './rides/entities/ride.entity';
import { CashPaymentDetails } from './orders/entities/cashPaymentDetails.entity';
import { PaymentDetails } from './orders/entities/paymentDetails.entity';
import { DriverEarning } from './rides/entities/driverEarnings.entity';
import { WithdrawalRequest } from './rides/entities/withdrawalRequest.entity';
import { ChargesModule } from './charges/charges.module';
import { Charge } from './charges/entities/charge.entity';
// import { RealtimeModule } from './realtime/realtime.module';
// import { OrdersFacadeModule } from './orders-facade/orders-facade.module';


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
        entities: [User, Card, DiverLicense, Nin, LocationDrive, 
          Vehicle, ProfileImage, plateNum, LicenseImg, VehicleReg, 
          Trip, Order, ProductImg, Ride,
          PaymentDetails, CashPaymentDetails, DriverEarning, WithdrawalRequest,Charge
        ],
        synchronize: true,
        extra: {
          max: 2 // Limit to 2 connections
        }
        // migrations: ['src/migrations/*.ts'],
      }),
    }),
    AuthModule,
    SmsModule,
    LocationModule,
    TripModule,
    OrdersModule,
    RidesModule,
    ChargesModule,
    // WsModule,
    // RealtimeModule,
    // OrdersFacadeModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}