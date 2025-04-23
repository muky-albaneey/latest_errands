/* eslint-disable prettier/prettier */
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from 'src/auth/entities/user.entity';
import { Ride } from 'src/rides/entities/ride.entity';
import { Order } from 'src/orders/entities/order.entity';

@Entity('driver_earnings')
export class DriverEarning {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.driverEarnings, { nullable: false })
  @JoinColumn({ name: 'driver_id' })
  driver: User;

  @OneToOne(() => Ride, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ride_id' })
  ride: Ride;

  @OneToOne(() => Order, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amountEarned: number;

  @Column({ type: 'enum', enum: ['unpaid', 'paid'], default: 'unpaid' })
  payoutStatus: 'unpaid' | 'paid';

  @CreateDateColumn()
  createdAt: Date;
}
