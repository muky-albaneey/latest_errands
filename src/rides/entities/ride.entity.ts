/* eslint-disable prettier/prettier */
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Order } from 'src/orders/entities/order.entity';
import { User } from 'src/auth/entities/user.entity';

export enum RideStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  SEARCHING = 'Searching',
  COMPLETED = 'completed',
  ARRIVED = 'arrived',
  ONGOING = 'ongoing'
  // possibly CANCELED, COMPLETED etc.
}

@Entity('rides')
export class Ride {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.rides, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => Order, (order) => order.rides, { eager: true })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column('uuid')
  orderId: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'driverId' })
  driver: User;

  @Column('uuid', { nullable: true })
  driverId: string;  

  // @Column({ default: 'Searching' })
  // status: string;
  @Column({ type: 'enum', enum: RideStatus, default: RideStatus.SEARCHING })
status: RideStatus;

}
