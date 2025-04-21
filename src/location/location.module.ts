/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { LocationGateway } from './location.gateway';
import { AuthModule } from 'src/auth/auth.module';
import { TripModule } from 'src/trip/trip.module';

@Module({
  imports: [TripModule, AuthModule],
  providers: [LocationGateway]
})
export class LocationModule {}
