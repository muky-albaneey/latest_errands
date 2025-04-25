/* eslint-disable prettier/prettier */
// src/charges/charges.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Charge } from './entities/charge.entity';
import { IsNull, Not, Repository } from 'typeorm';

@Injectable()
export class ChargesService {
  constructor(
    @InjectRepository(Charge)
    private readonly chargeRepo: Repository<Charge>,
  ) {}


  // Accepts a map of state names to fixed charges
// src/charges/charges.service.ts

async setCharges(stateCharges: Record<string, Record<string, number>>): Promise<Charge> {
  let charge = await this.chargeRepo.findOne({ where: {} });

  if (charge) {
    charge.stateCharges = stateCharges;
  } else {
    charge = this.chargeRepo.create({ stateCharges });
  }

  return this.chargeRepo.save(charge);
}



  // Retrieves the global charges
  async getCharges(): Promise<Charge> {
    return this.chargeRepo.findOne({ where: {} });
  }

  async getAllStateCharges(): Promise<Record<string, number>> {
    // const charge = await this.chargeRepo.findOne({ where: {} });
    const charge = await this.chargeRepo.findOne({
      where: { stateCharges: Not(IsNull()) }, // Only get a charge that has stateCharges
      order: { createdAt: 'DESC' },           // Get the most recent one
    });
    
    if (!charge) {
      return {};
    }
  
    return charge.stateCharges || {};
  }
 // Sets the percentageCharge for the current configuration
 async setPercentageCharge(percentageCharge: number): Promise<Charge> {
  let charge = await this.chargeRepo.findOne({ where: {} });

  if (charge) {
    // Update the existing charge config with the new percentageCharge
    charge.percentageCharge = percentageCharge;
  } else {
    // Create a new charge config if one does not exist
    charge = this.chargeRepo.create({ percentageCharge, stateCharges: {} });
  }

  // Save and return the updated or new charge config
  return this.chargeRepo.save(charge);
}  
  
}
