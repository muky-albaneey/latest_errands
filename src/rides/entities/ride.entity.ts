/* eslint-disable prettier/prettier */
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Order } from 'src/orders/entities/order.entity';
import { User } from 'src/auth/entities/user.entity';

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

  @Column('uuid')
  driverId: string;

  @Column({ default: 'Searching' })
  status: string;
}
