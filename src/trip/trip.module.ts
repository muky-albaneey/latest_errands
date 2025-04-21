/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { TripService } from './trip.service';
import { TripController } from './trip.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { HttpModule} from '@nestjs/axios'; // Import HttpModule
import { Trip } from 'src/trip/entities/trip.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Trip]),
    ConfigModule,
    HttpModule,
  ],
  providers: [TripService],
  controllers: [TripController],
  exports: [TripService], // 👈 Add this
})
export class TripModule {}
