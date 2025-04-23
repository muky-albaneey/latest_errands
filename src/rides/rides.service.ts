/* eslint-disable prettier/prettier */
// import { Injectable } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import { Ride } from './entities/ride.entity';

// @Injectable()
// export class RidesService {
//     constructor(
//         @InjectRepository(Ride)
//         private ridesRepository: Repository<Ride>,
//       ) {}

//       createRide(rideData: Partial<Ride>) {
//         const newRide = this.ridesRepository.create(rideData);
//         return this.ridesRepository.save(newRide);
//       }
    
//       updateRideStatus(rideId, status: string) {
//         return this.ridesRepository.update(rideId, { status });
//       }
//       async driverAcceptRide(rideId, driverId: string) {
//         return this.ridesRepository.update(rideId, {
//           driverId,
//           status: 'Accepted',
//         });
//       }
//       async driverRejectRide(rideId, driverId) {
//         return this.ridesRepository.update(rideId, {
//           driverId: null,
//           status: 'Rejected',
//         });
//       }
      
      
//       assignDriver(rideId, driverId) {
//         return this.ridesRepository.update(rideId, { driverId, status: 'Assigned' });
//       }
// }
/* eslint-disable prettier/prettier */
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ride, RideStatus } from './entities/ride.entity';
// import { RideStatus } from './ride-status.enum';

@Injectable()
export class RidesService {
  constructor(
    @InjectRepository(Ride)
    private ridesRepository: Repository<Ride>,
  ) {}

  createRide(rideData: Partial<Ride>) {
    const newRide = this.ridesRepository.create({
      ...rideData,
      status: RideStatus.PENDING,
    });
    return this.ridesRepository.save(newRide);
  }

  updateRideStatus(rideId, status: RideStatus) {
    return this.ridesRepository.update(rideId, { status });
  }

  async driverAcceptRide(rideId, driverId) {
    const ride = await this.ridesRepository.findOneBy({ id: rideId });
    if (!ride) throw new NotFoundException('Ride not found');
    if (ride.status !== RideStatus.ASSIGNED) {
      throw new BadRequestException('Ride must be assigned before acceptance');
    }
    if (ride.driverId !== driverId) {
      throw new BadRequestException('Driver not assigned to this ride');
    }

    ride.status = RideStatus.ACCEPTED;
    return this.ridesRepository.save(ride);
  }

  async driverRejectRide(rideId, driverId) {
    const ride = await this.ridesRepository.findOneBy({ id: rideId });
    if (!ride) throw new NotFoundException('Ride not found');
    if (ride.status !== RideStatus.ASSIGNED) {
      throw new BadRequestException('Ride must be assigned before rejection');
    }
    if (ride.driverId !== driverId) {
      throw new BadRequestException('Driver not assigned to this ride');
    }

    ride.status = RideStatus.REJECTED;
    ride.driverId = null;
    return this.ridesRepository.save(ride);
  }

  assignDriver(rideId, driverId) {
    return this.ridesRepository.update(rideId, {
      driverId,
      status: RideStatus.ASSIGNED,
    });
  }
}
