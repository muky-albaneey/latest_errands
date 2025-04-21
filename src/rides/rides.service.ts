/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ride } from './entities/ride.entity';

@Injectable()
export class RidesService {
    constructor(
        @InjectRepository(Ride)
        private ridesRepository: Repository<Ride>,
      ) {}

      createRide(rideData: Partial<Ride>) {
        const newRide = this.ridesRepository.create(rideData);
        return this.ridesRepository.save(newRide);
      }
    
      updateRideStatus(rideId: number, status: string) {
        return this.ridesRepository.update(rideId, { status });
      }
    
      assignDriver(rideId: number, driverId: number) {
        return this.ridesRepository.update(rideId, { driverId, status: 'Assigned' });
      }
}
