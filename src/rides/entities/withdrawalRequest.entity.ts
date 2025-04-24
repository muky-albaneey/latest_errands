/* eslint-disable prettier/prettier */
// src/entities/withdrawalRequest.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from 'src/auth/entities/user.entity';

@Entity()
export class WithdrawalRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.withdrawalRequests)
  driver: User;

  @Column()
  amount: number;  // Amount the driver wants to withdraw

  @Column()
  status: 'pending' | 'approved' | 'rejected';  // Status of the request

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  rejectedAt: Date;
}
