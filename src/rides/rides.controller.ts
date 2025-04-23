/* eslint-disable prettier/prettier */

import { Controller, Post, Patch, Body, Param } from '@nestjs/common';
import { RidesService } from './rides.service';

@Controller('rides')
export class RidesController {
  constructor(private ridesService: RidesService) {}

  @Post()
  createRide(@Body() rideData: any) {
    return this.ridesService.createRide(rideData);
  }
  @Patch(':id/accept')
  driverAcceptRide(
    @Param('id') id: string,
    @Body('driverId') driverId: string,
  ) {
    return this.ridesService.driverAcceptRide(id, driverId);
  }
  @Patch(':id/reject')
driverRejectRide(
  @Param('id') id: string,
  @Body('driverId') driverId: string,
) {
  return this.ridesService.driverRejectRide(id, driverId);
}

  @Patch(':id/status')
  updateRideStatus(
    @Param('id') id: string, // was number ❌ now string ✅
    @Body('status') status: string,
  ) {
    return this.ridesService.updateRideStatus(id, status);
  }

  @Patch(':id/assign')
  assignDriver(
    @Param('id') id: string, // was number ❌ now string ✅
    @Body('driverId') driverId: string, // was number ❌ now string ✅
  ) {
    return this.ridesService.assignDriver(id, driverId);
  }
}
