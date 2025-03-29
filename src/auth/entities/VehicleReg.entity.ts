/* eslint-disable prettier/prettier */
import { Entity, JoinColumn, OneToOne } from 'typeorm';
import { AbstractFileEntity } from './abstract.entity';
import { User } from './auth.entity';

@Entity()
export class VehicleReg extends AbstractFileEntity<VehicleReg> {


    @OneToOne(() => User)
    @JoinColumn()
    user: User;  // One-to-One relationship with Product

    constructor(vehicleReg: Partial<VehicleReg>) {
        super(vehicleReg);
    }

   
}