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
  
    @Patch(':id/status')
    updateRideStatus(
      @Param('id') id: number,
      @Body('status') status: string,
    ) {
      return this.ridesService.updateRideStatus(id, status);
    }
  
    @Patch(':id/assign')
    assignDriver(
      @Param('id') id: number,
      @Body('driverId') driverId: number,
    ) {
      return this.ridesService.assignDriver(id, driverId);
    }
}
