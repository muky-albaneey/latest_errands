/* eslint-disable prettier/prettier */
// src/trip/trip.controller.ts
import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { TripService } from './trip.service';
import { CreateTripDto } from './dto/create-trip.dto';
// import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { UpdateLocationDto } from './dto/update-location.dto';
import { JwtGuard } from 'src/guards/jwt.guards';
import { User } from 'src/decorators/user.decorator';

@Controller('trip')
export class TripController {
  constructor(private readonly tripService: TripService) {}

  @UseGuards(JwtGuard)
  @Post()
  async createTrip(@Body() createTripDto: CreateTripDto, @User('sub') userId: string, @Req() req: Request) {
    // const user = req.user as any;
    return this.tripService.createTrip(createTripDto, userId);
  }

@UseGuards(JwtGuard)
@Post('update-location')
async updateLocation(@Body() dto: UpdateLocationDto, @User('sub') userId: string, @Req() req: Request) {
  
  // const user = req.user as any;
  return this.tripService.updateInitialLocation(dto, userId);
}

@Post('user/update')
  async updateUserLocation(@Body() body: { userId: string; lat: number; long: number }) {
    return this.tripService.updateUserLocation(body.userId, body.lat, body.long);
  }
  
}
