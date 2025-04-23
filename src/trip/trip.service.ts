 /* eslint-disable prettier/prettier */

import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTripDto } from './dto/create-trip.dto';
import { Trip } from 'src/trip/entities/trip.entity';
import { User } from 'src/auth/entities/user.entity';
import { Between } from 'typeorm';
import { UpdateLocationDto } from './dto/update-location.dto';
import * as dayjs from 'dayjs';

@Injectable()
export class TripService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Trip)
    private readonly tripRepo: Repository<Trip>,
  ) {}

  async createTrip(createTripDto: CreateTripDto, userId) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new ForbiddenException('User not found');

    if (!user.isRider) {
      throw new ForbiddenException('You must be a rider to create a trip');
    }

    const todayStart = dayjs().startOf('day').toDate();
    const todayEnd = dayjs().endOf('day').toDate();

    const todayTrips = await this.tripRepo.find({
      where: {
        user: { id: userId },
        created: Between(todayStart, todayEnd),
      },
      order: { created: 'DESC' },
    });

    const coordinateUpdates = todayTrips.filter(
      (trip) =>
        trip.initialLat !== null ||
        trip.initialLong !== null ||
        trip.finalLat !== null ||
        trip.finalLong !== null
    ).length;

    if (coordinateUpdates >= 2) {
      throw new ForbiddenException('You can only set trip coordinates twice per day.');
    }

    const todayTrip = todayTrips[0];
    if (todayTrip) {
      todayTrip.initialLat = createTripDto.initialLat;
      todayTrip.initialLong = createTripDto.initialLong;
      todayTrip.finalLat = createTripDto.finalLat;
      todayTrip.finalLong = createTripDto.finalLong;
      return this.tripRepo.save(todayTrip);
    } else {
      const trip = this.tripRepo.create({ ...createTripDto, user });
      return this.tripRepo.save(trip);
    }
  }

  async updateInitialLocation(dto: UpdateLocationDto, userId) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new ForbiddenException('User not found');

    if (!user.isRider) {
      throw new ForbiddenException('Only riders can update location');
    }

    const todayStart = dayjs().startOf('day').toDate();
    const todayEnd = dayjs().endOf('day').toDate();

    const todayTrip = await this.tripRepo.findOne({
      where: {
        user: { id: userId },
        created: Between(todayStart, todayEnd),
      },
      order: { created: 'DESC' },
    });

    if (todayTrip) {
      todayTrip.initialLat = dto.initialLat;
      todayTrip.initialLong = dto.initialLong;
      return this.tripRepo.save(todayTrip);
    } else {
      const newTrip = this.tripRepo.create({
        initialLat: dto.initialLat,
        initialLong: dto.initialLong,
        user,
      });
      return this.tripRepo.save(newTrip);
    }
  }

  async updateUserLocation(userId, lat: number, long: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    user.lat = lat;
    user.long = long;

    return this.userRepository.save(user);
  }
}
