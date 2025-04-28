/* eslint-disable prettier/prettier */
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ride, RideStatus } from './entities/ride.entity';
import { DriverEarning } from './entities/driverEarnings.entity';
import { WithdrawalRequest } from './entities/withdrawalRequest.entity';
import { User } from 'src/auth/entities/user.entity';
import { Charge } from 'src/charges/entities/charge.entity';
import { MailService } from 'src/mail/mail.service';
import { AuthService } from 'src/auth/auth.service';
// import { RideStatus } from './ride-status.enum';

@Injectable()
export class RidesService {
  constructor(
    private readonly emailservice: MailService,

    // private readonly userService: AuthService,
    
    @InjectRepository(Ride)
    private ridesRepository: Repository<Ride>,

    @InjectRepository(DriverEarning)
    private earningRepository: Repository<DriverEarning>,

    @InjectRepository(WithdrawalRequest)
    private withdrawalRepository: Repository<WithdrawalRequest>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Charge) 
    private readonly chargeRepository: Repository<Charge>

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
    // if (ride.status !== RideStatus.ASSIGNED) {
    //   throw new BadRequestException('Ride must be assigned before rejection');
    // }
    if (![RideStatus.ASSIGNED, RideStatus.PENDING].includes(ride.status)) {
      throw new BadRequestException('Ride must be assigned or pending before acceptance');
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
  async driverArrivedAtPickUpLocation(rideId, driverId) {
    const ride = await this.ridesRepository.findOneBy({ id: rideId });
    if (!ride) throw new NotFoundException('Ride not found');
    if (ride.status !== RideStatus.ACCEPTED) {
      throw new BadRequestException('Ride must be accepted by you before arriving at the trip');
    }
 
    
    if (ride.driverId !== driverId) {
      throw new BadRequestException('Driver not assigned to this ride');
    }

    ride.status = RideStatus.ARRIVED;
    return this.ridesRepository.save(ride);
  }
  async driverOnTrip(rideId, driverId) {
    const ride = await this.ridesRepository.findOneBy({ id: rideId });
    if (!ride) throw new NotFoundException('Ride not found');
      if (![RideStatus.ARRIVED, RideStatus.ACCEPTED].includes(ride.status)) {
      throw new BadRequestException('Ride must be accepted or arrive at location before acceptance');
    }
 
    
    if (ride.driverId !== driverId) {
      throw new BadRequestException('Driver not assigned to this ride');
    }

    ride.status = RideStatus.ONGOING;
    return this.ridesRepository.save(ride);
  }
  
  async completeRide(rideId): Promise<void> {
    const ride = await this.ridesRepository.findOne({
      where: { id: rideId },
      relations: ['order', 'driver'],
    });
  
    if (!ride || !ride.order || !ride.driver) {
      throw new Error('Ride, order, or driver not found');
    }
   // ✅ Fetch the global charge configuration
    const charge = await this.chargeRepository.findOne({ where: {} });
    if (!charge) {
      throw new Error('Charge configuration not found');
    }
    const percent = Number(charge.percentageCharge);
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

    // Add this to the RidesService class
    async getLatestPaidEarningsWithTotal(): Promise<{
      totalEarning: number;
      latestPaidEarnings: DriverEarning[];
    }> {
      const latestPaidEarnings = await this.earningRepository
        .createQueryBuilder('earning')
        .innerJoinAndSelect('earning.driver', 'driver')
        .innerJoinAndSelect('earning.ride', 'ride')
        .innerJoinAndSelect('earning.order', 'order')
        .where('earning.payoutStatus = :status', { status: 'paid' })
        .andWhere(qb => {
          const subQuery = qb
            .subQuery()
            .select('MAX(subEarning.createdAt)', 'max')
            .from(DriverEarning, 'subEarning')
            .where('subEarning.driver = earning.driver')
            .andWhere('subEarning.payoutStatus = :status', { status: 'paid' })
            .getQuery();
          return `earning.createdAt = ${subQuery}`;
        })
        .getMany();
    
      const totalEarning = latestPaidEarnings.reduce((sum, earning) => sum + Number(earning.amountEarned), 0);
    
      return {
        totalEarning,
        latestPaidEarnings,
      };
    }
    

    async getPaidEarningsForDriver(driverId): Promise<{ totalEarning: number, earnings: DriverEarning[] }> {
      const earnings = await this.earningRepository.find({
        where: {
          driver: { id: driverId },
          payoutStatus: 'paid',
        },
        relations: ['driver', 'ride', 'order'],
        order: { createdAt: 'DESC' },
      });
    
      const totalEarning = earnings.reduce((sum, earning) => sum + Number(earning.amountEarned), 0);
    
      return {
        totalEarning,
        earnings,
      };
    }
    
  async getUnpaidEarnings(): Promise<DriverEarning[]> {
    return this.earningRepository.find({
      where: { payoutStatus: 'unpaid' },
      relations: ['driver', 'ride', 'order'],
      order: { createdAt: 'DESC' },
    });
  }


async getUnpaidEarningsForDriver(driverId): Promise<{ totalEarning: number, earnings: DriverEarning[] }> {
  const earnings = await this.earningRepository.find({
    where: {
      driver: { id: driverId },
      payoutStatus: 'unpaid',
    },
    relations: ['driver', 'ride', 'order'],
    order: { createdAt: 'DESC' },
  });

  const totalEarning = earnings.reduce((sum, earning) => sum + Number(earning.amountEarned), 0);

  return {
    totalEarning,
    earnings,
  };
}
async getAllEarningsForDriver(driverId): Promise<{ totalEarning: number, earnings: DriverEarning[] }> {
  const earnings = await this.earningRepository.find({
    where: {
      driver: { id: driverId },
    },
    relations: ['driver', 'ride', 'order'],
    order: { createdAt: 'DESC' },
  });

  const totalEarning = earnings.reduce((sum, earning) => sum + Number(earning.amountEarned), 0);

  return {
    totalEarning,
    earnings,
  };
}


  async markEarningsAsPaid(driverId): Promise<void> {
    // Fetch the unpaid earnings for the driver
    const unpaidEarnings = await this.earningRepository.find({
      where: {
        driver: { id: driverId },
        payoutStatus: 'unpaid',
      },
    });
  
    if (unpaidEarnings.length === 0) {
      throw new NotFoundException('No unpaid earnings found for this driver');
    }
  
    // Fetch the driver/user data (userSaved) based on driverId
    const userSaved = await this.userRepository.findOne({ where: { id: driverId } });
  
    if (!userSaved) {
      throw new NotFoundException('Driver not found');
    }
  
    // Mark all unpaid earnings as paid
    for (const earning of unpaidEarnings) {
      earning.payoutStatus = 'paid';
    }
  
    // Send email notification to the driver
    await this.emailservice.dispatchEmail(
      userSaved.email, // Use userSaved.email to get the email address
      'Earnings Paid Successfully',
      `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #28a745;">Earnings Paid Successfully</h2>
          <p>Hi ${userSaved.fname},</p>
          <p>Your requested withdrawal for your earnings has been successfully paid into your account.</p>
          <p>If you didn't request this withdrawal, please ignore this email.</p>
       </div>`
    );
  
    // Save the updated earnings status
    await this.earningRepository.save(unpaidEarnings);
  }
    // Request a withdrawal
    async requestWithdrawal(userId, amount: number): Promise<WithdrawalRequest> {
      // Fetch the user
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });
  
      if (!user) {
        throw new NotFoundException('User not found');
      }
  
      // Check if the user is a driver (isRider flag should be true)
      if (!user.isRider) {
        throw new BadRequestException('User is not a driver');
      }
  
      // Fetch unpaid earnings for the driver
      const unpaidEarnings = await this.earningRepository.find({
        where: {
          driver: { id: userId },
          payoutStatus: 'unpaid',
        },
      });
  
      // const totalUnpaidAmount = unpaidEarnings.reduce((sum, earning) => sum + earning.amountEarned, 0);
      const totalUnpaidAmount = unpaidEarnings.reduce((sum, earning) => sum + Number(earning.amountEarned), 0);

      // Check if the requested amount is less than or equal to the total unpaid earnings
      if (amount > totalUnpaidAmount) {
        throw new BadRequestException('Requested amount exceeds unpaid earnings');
      }
  
      // Create and save the withdrawal request
      const withdrawalRequest = this.withdrawalRepository.create({
        driver: user,
        amount,
        status: 'pending',
      });
  
      return this.withdrawalRepository.save(withdrawalRequest);
    }
}
