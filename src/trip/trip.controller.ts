/* eslint-disable prettier/prettier */
// src/trip/trip.controller.ts
import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { TripService } from './trip.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { UpdateLocationDto } from './dto/update-location.dto';

@Controller('trip')
export class TripController {
  constructor(private readonly tripService: TripService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createTrip(@Body() createTripDto: CreateTripDto, @Req() req: Request) {
    const user = req.user as any;
    return this.tripService.createTrip(createTripDto, user);
  }

@UseGuards(JwtAuthGuard)
@Post('update-location')
async updateLocation(@Body() dto: UpdateLocationDto, @Req() req: Request) {
  const user = req.user as any;
  return this.tripService.updateInitialLocation(dto, user);
}

@Post('user/update')
  async updateUserLocation(@Body() body: { userId: string; lat: number; long: number }) {
    return this.tripService.updateUserLocation(body.userId, body.lat, body.long);
  }
  
}
