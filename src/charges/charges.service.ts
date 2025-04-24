/* eslint-disable prettier/prettier */
// src/charges/charges.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Charge } from './entities/charge.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ChargesService {
  constructor(
    @InjectRepository(Charge)
    private readonly chargeRepo: Repository<Charge>,
  ) {}

  // Sets or updates the global charges
  async setCharges(percentageCharge: number, distanceChargePerKm: number): Promise<Charge> {
    // Try to find the existing config
    let charge = await this.chargeRepo.findOne({ where: {} });

    if (charge) {
      // Update existing config
      charge.percentageCharge = percentageCharge;
      charge.distanceChargePerKm = distanceChargePerKm;
    } else {
      // Create new config if none exists
      charge = this.chargeRepo.create({ percentageCharge, distanceChargePerKm });
    }

    // Save and return the updated or new config
    return this.chargeRepo.save(charge);
  }

  // Retrieves the global charges
  async getCharges(): Promise<Charge> {
    return this.chargeRepo.findOne({ where: {} });
  }
}
