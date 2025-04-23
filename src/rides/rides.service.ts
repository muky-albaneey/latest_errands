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
import { DriverEarning } from './entities/driverEarnings.entity';
// import { RideStatus } from './ride-status.enum';

@Injectable()
export class RidesService {
  constructor(
    @InjectRepository(Ride)
    private ridesRepository: Repository<Ride>,

    @InjectRepository(DriverEarning)
    private earningRepository: Repository<DriverEarning>,
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
    // if (ride.status !== RideStatus.ASSIGNED || ride.status !== RideStatus.PENDING) {
    //   throw new BadRequestException('Ride must be assigned before acceptance');
    // }
    if (![RideStatus.ASSIGNED, RideStatus.PENDING].includes(ride.status)) {
      throw new BadRequestException('Ride must be assigned or pending before acceptance');
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

  async completeRide(rideId): Promise<void> {
    const ride = await this.ridesRepository.findOne({
      where: { id: rideId },
      relations: ['order', 'driver'],
    });
  
    if (!ride || !ride.order || !ride.driver) {
      throw new Error('Ride, order, or driver not found');
    }
  
    const percent = 60;
    const amountEarned = (percent / 100) * Number(ride.order.cost);
  
    const earning = this.earningRepository.create({
      driver: ride.driver,
      ride: ride,
      order: ride.order,
      amountEarned,
      payoutStatus: 'unpaid',
    });
  
    await this.earningRepository.save(earning);
  
    ride.status = RideStatus.COMPLETED;
    await this.ridesRepository.save(ride);
  }
  
}
