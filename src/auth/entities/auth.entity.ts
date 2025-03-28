/* eslint-disable prettier/prettier */
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToOne,
    JoinColumn,
    BeforeInsert,
    OneToMany,
    ManyToMany,
    JoinTable
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Card } from './card.entity';
import {  Nin} from './nin';

import { DiverLicense } from './license.entity';
import { Exclude, instanceToPlain } from 'class-transformer';
import { LocationDrive } from './location_drive';
import { Vehicle } from './vehicle.entity';

export enum UserRole {
    ADMIN = "admin",
    USER = "user"
}



@Entity()
export class User {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({type : 'varchar',  length: 140, unique : true, nullable: false})
    phoneNumber: string;

    @Column({ type: 'varchar', length: 140, unique : true, nullable: false })
    email: string;

    @Column({ type: 'varchar', nullable: false  })
    @Exclude() 
    password?: string;

    @Column({type: 'varchar', nullable : true})
    fname?: string;

    @Column({type: 'varchar', nullable : true})
    lname?: string;

    @Column({type: 'varchar', nullable : true})
    rememberToken?: string;
    
    @Column({
        type: "enum",
        enum: UserRole,
        default: UserRole.USER, nullable: false })
    role: UserRole;

    @Column({ type: 'boolean', nullable: true, default: false })
    isRider?: boolean;

    @OneToOne(() => Card, { cascade: true, nullable: true, onUpdate: 'CASCADE', onDelete: 'CASCADE' })
    @JoinColumn()
    card?: Card;

    @OneToOne(() => DiverLicense, (driver) => driver.user, { cascade: true, nullable: true, onDelete: 'SET NULL' })
    @JoinColumn()
    @Exclude()
    driver?: DiverLicense;

    @OneToOne(() => Nin, (nin) => nin.user, { cascade: true, nullable: true, onDelete: 'SET NULL' })
    @JoinColumn()
    @Exclude() 
    nin?: Nin;

    @OneToOne(() => LocationDrive, (location) => location.user, { cascade: true, nullable: true, onDelete: 'SET NULL' })
    @JoinColumn()
    @Exclude() 
    location_drive: LocationDrive;   

    // One-to-One relationship with Vehicle
    @OneToOne(() => Vehicle, (vehicle) => vehicle.user, {
        cascade: true,
        nullable: true,
        onDelete: 'SET NULL',
    })
    @JoinColumn()
    vehicle?: Vehicle;



    toJSON() {
        return instanceToPlain(this, { excludePrefixes: ['_'] });
    }


    constructor(user :Partial<User>){
        Object.assign(this, user)
    }
   
}

