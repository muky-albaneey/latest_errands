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
    
      updateRideStatus(rideId, status: string) {
        return this.ridesRepository.update(rideId, { status });
      }
      async driverAcceptRide(rideId, driverId: string) {
        return this.ridesRepository.update(rideId, {
          driverId,
          status: 'Accepted',
        });
      }
      async driverRejectRide(rideId, driverId) {
        return this.ridesRepository.update(rideId, {
          driverId: null,
          status: 'Rejected',
        });
      }
      
      
      assignDriver(rideId, driverId) {
        return this.ridesRepository.update(rideId, { driverId, status: 'Assigned' });
      }
}
