/* eslint-disable prettier/prettier */
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToOne,
    JoinColumn,
  } from 'typeorm';
  import { User } from './auth.entity';
import { Exclude } from 'class-transformer';
  
@Entity()
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  vehicleType: string;

  @Column()
  vehicleBrand: string;

  @Column()
  vehicleYear: string;

  @Column()
  vehicleColor: string;

  @Column({ unique: true })
  licensePlate: string;

  @Column('float')
  vehicleCapacity: number;

  @Column()
  unit: string;

  @Column({ nullable: true })
  specialEquipment?: string;

 // One-to-One relationship with User
 @OneToOne(() => User, (user) => user.vehicle)
 @Exclude()
 user?: User;
 


  constructor(vehicle: Partial<Vehicle>) {
    Object.assign(this, vehicle);
}

}
