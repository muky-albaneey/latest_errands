/* eslint-disable prettier/prettier */
import { Controller, Post, Patch, Body, Param, ParseUUIDPipe, Get, NotFoundException, Put, BadRequestException } from '@nestjs/common';
import { RidesService } from './rides.service';
import { RideStatus } from './entities/ride.entity';
import { AssignDriverDto } from './dto/assign-driver.dto';
import { DriverRejectRideDto } from './dto/driver-reject-ride.dto';
import { CreateRideDto } from './dto/create-ride.dto';
import { DriverAcceptRideDto } from './dto/driver-accept-ride.dto';
import { DriverEarning } from './entities/driverEarnings.entity';
import { WithdrawalRequest } from './entities/withdrawalRequest.entity';

@Controller('rides')
export class RidesController {
  constructor(private ridesService: RidesService) {}

  @Post()
  createRide(@Body() rideData: CreateRideDto) {
    return this.ridesService.createRide(rideData);
  }
// Get latest paid earnings
@Get('latest-paid')
async getLatestPaidEarnings(): Promise<DriverEarning[]> {
  try {
    return await this.ridesService.getLatestPaidEarnings();
  } catch (error) {
    throw new NotFoundException('No latest paid earnings found',error);
  }
}

// Get unpaid earnings for a specific driver
@Get('unpaid/:driverId')
async getUnpaidEarningsForDriver(@Param('driverId') driverId: string): Promise<DriverEarning[]> {
  const unpaidEarnings = await this.ridesService.getUnpaidEarningsForDriver(driverId);
  if (unpaidEarnings.length === 0) {
    throw new NotFoundException(`No unpaid earnings found for driver with ID ${driverId}`);
  }
  return unpaidEarnings;
}

// Get all unpaid earnings
@Get('unpaid')
async getUnpaidEarnings(): Promise<DriverEarning[]> {
  return await this.ridesService.getUnpaidEarnings();
}
@Post('request/:userId')
async requestWithdrawal(
  @Param('userId') userId: string,
  @Body('amount') amount: number,
): Promise<WithdrawalRequest> {
  try {
    const withdrawalRequest = await this.ridesService.requestWithdrawal(userId, amount);
    return withdrawalRequest;
  } catch (error) {
    if (error instanceof NotFoundException || error instanceof BadRequestException) {
      throw error;
    }
    throw new Error('Unexpected error while processing the withdrawal request');
  }
}
// Mark earnings as paid for a specific driver
@Put('mark-paid/:driverId')
async markEarningsAsPaid(@Param('driverId') driverId: string): Promise<string> {
  try {
    await this.ridesService.markEarningsAsPaid(driverId);
    return `Earnings for driver with ID ${driverId} have been marked as paid`;
  } catch (error) {
    throw new NotFoundException(error.message);
  }
}
  @Patch(':id/accept')
driverAcceptRide(
  @Param('id', new ParseUUIDPipe()) id: string,
  @Body() driverAcceptRideDto: DriverAcceptRideDto,
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
  return this.ridesService.completeRide(id);
}


  @Patch(':id/assign')
  assignDriver(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() assignDriverDto: AssignDriverDto,
  ) {
    return this.ridesService.assignDriver(id, assignDriverDto.driverId);
  }
}
