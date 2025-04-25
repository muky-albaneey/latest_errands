/* eslint-disable prettier/prettier */
// src/charges/entities/charge.entity.ts

import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

// src/charges/entities/charge.entity.ts

@Entity()
export class Charge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('jsonb', { nullable: false, default: {} })
  stateCharges: Record<string, Record<string, number>>; // Now allows nested charge objects

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  percentageCharge: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
