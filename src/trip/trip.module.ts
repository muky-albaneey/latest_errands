/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { TripService } from './trip.service';
import { TripController } from './trip.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { HttpModule} from '@nestjs/axios'; // Import HttpModule
import { Trip } from 'src/auth/entities/trip.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Trip]),
    ConfigModule,
    HttpModule,
  ],
  providers: [TripService],
  controllers: [TripController]
})
export class TripModule {}
