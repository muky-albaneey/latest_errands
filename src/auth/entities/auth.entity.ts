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


export enum UserRole {
    ADMIN = "admin",
    USER = "user",
}


@Entity()
export class User {
    @PrimaryGeneratedColumn("uuid")
    id?: string;

    @Column({type : 'varchar',  length: 140, unique : true, nullable: false})
    phoneNumber: string;

    @Column({ type: 'varchar', length: 140, unique : true, nullable: false })
    email?: string;

    @Column({ type: 'varchar', nullable: false  })
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
        default: UserRole.USER, nullable: false 
    })
    role: UserRole

    @OneToOne(() => Card, { cascade: true, nullable: true, onUpdate: 'CASCADE', onDelete: 'CASCADE' })
    @JoinColumn()
    card?: Card;

    constructor(user :Partial<User>){
        Object.assign(this, user)
    }
   
}

