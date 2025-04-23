/* eslint-disable prettier/prettier */

// import { Controller, Post, Patch, Body, Param } from '@nestjs/common';
// import { RidesService } from './rides.service';

// @Controller('rides')
// export class RidesController {
//   constructor(private ridesService: RidesService) {}

//   @Post()
//   createRide(@Body() rideData: any) {
//     return this.ridesService.createRide(rideData);
//   }
//   @Patch(':id/accept')
//   driverAcceptRide(
//     @Param('id') id: string,
//     @Body('driverId') driverId: string,
//   ) {
//     return this.ridesService.driverAcceptRide(id, driverId);
//   }
//   @Patch(':id/reject')
// driverRejectRide(
//   @Param('id') id: string,
//   @Body('driverId') driverId: string,
// ) {
//   return this.ridesService.driverRejectRide(id, driverId);
// }

//   @Patch(':id/status')
//   updateRideStatus(
//     @Param('id') id: string, // was number ❌ now string ✅
//     @Body('status') status: string,
//   ) {
//     return this.ridesService.updateRideStatus(id, status);
//   }

//   @Patch(':id/assign')
//   assignDriver(
//     @Param('id') id: string, // was number ❌ now string ✅
//     @Body('driverId') driverId: string, // was number ❌ now string ✅
//   ) {
//     return this.ridesService.assignDriver(id, driverId);
//   }
// }
/* eslint-disable prettier/prettier */
import { Controller, Post, Patch, Body, Param } from '@nestjs/common';
import { RidesService } from './rides.service';
import { RideStatus } from './entities/ride.entity';
import { AssignDriverDto } from './dto/assign-driver.dto';
import { DriverRejectRideDto } from './dto/driver-reject-ride.dto';
import { CreateRideDto } from './dto/create-ride.dto';
import { DriverAcceptRideDto } from './dto/driver-accept-ride.dto';

@Controller('rides')
export class RidesController {
  constructor(private ridesService: RidesService) {}

  @Post()
  createRide(@Body() rideData: CreateRideDto) {
    return this.ridesService.createRide(rideData);
  }

  @Patch(':id/accept')
  driverAcceptRide(
    @Param('id') id: string,
    @Body('driverId') driverAcceptRideDto: DriverAcceptRideDto,
  ) {
    return this.ridesService.driverAcceptRide(id, driverAcceptRideDto.driverId);
  }

  @Patch(':id/reject')
  driverRejectRide(
    @Param('id') id: string,
    @Body('driverId') driverRejectRideDto: DriverRejectRideDto,
  ) {
    return this.ridesService.driverRejectRide(id, driverRejectRideDto.driverId);
  }

  @Patch(':id/status')
  updateRideStatus(
    @Param('id') id: string,
    @Body('status') status: RideStatus,
  ) {
    return this.ridesService.updateRideStatus(id, status);
  }
  @Patch(':id/complete')
completeRide(@Param('id') id: string) {
  return this.ridesService.updateRideStatus(id, RideStatus.COMPLETED);
}


  @Patch(':id/assign')
  assignDriver(
    @Param('id') id: string,
    @Body('driverId') assignDriverDto: AssignDriverDto,
  ) {
    return this.ridesService.assignDriver(id, assignDriverDto.driverId);
  }
}
