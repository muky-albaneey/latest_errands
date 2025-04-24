// src/charges/entities/charge.entity.ts

import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Charge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  percentageCharge: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  distanceChargePerKm: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
