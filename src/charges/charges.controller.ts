/* eslint-disable prettier/prettier */
// src/charges/charges.controller.ts

import { Controller, Get, Post, Body } from '@nestjs/common';
import { ChargesService } from './charges.service';

@Controller('charges')
export class ChargesController {
  constructor(private readonly chargesService: ChargesService) {}

  // @Post('set')
  // async setCharges(
  //   @Body('percentageCharge') percentageCharge: number,
  //   @Body('distanceChargePerKm') distanceChargePerKm: number,
  // ) {
  //   const charge = await this.chargesService.setCharges(percentageCharge, distanceChargePerKm);
  //   return {
  //     message: 'Charges updated successfully',
  //     percentageCharge: charge.percentageCharge,
  //     distanceChargePerKm: charge.distanceChargePerKm,
  //   };
  // }
  @Post('set')
async setCharges(
  @Body('stateCharges') stateCharges: Record<string, number>,
) {
  const charge = await this.chargesService.setCharges(stateCharges);
  return {
    message: 'Charges updated successfully',
    stateCharges: charge.stateCharges,
  };
}

  // @Get()
  // async getCharges() {
  //   const charge = await this.chargesService.getCharges();
  //   return {
  //     message: 'Current charge configuration retrieved successfully',
  //     percentageCharge: charge?.percentageCharge ?? 0,
  //     distanceChargePerKm: charge?.distanceChargePerKm ?? 0,
  //   };
  // }
  @Get()
async getCharges() {
  const charge = await this.chargesService.getCharges();
  return {
    message: 'Current charge configuration retrieved successfully',
    stateCharges: charge?.stateCharges ?? {},
  };
}

@Get('states')
async getAllStateCharges() {
  const stateCharges = await this.chargesService.getAllStateCharges();
  return {
    message: 'State charges retrieved successfully',
    stateCharges,
  };
}


}
