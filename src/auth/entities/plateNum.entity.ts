/* eslint-disable prettier/prettier */
import { Entity, JoinColumn, OneToOne } from 'typeorm';
import { AbstractFileEntity } from './abstract.entity';
import { User } from './auth.entity';

@Entity()
export class plateNum extends AbstractFileEntity<plateNum> {

     @OneToOne(() => User)
        @JoinColumn()
        user: User;  // One-to-One relatio

        
    constructor(plateNum: Partial<plateNum>) {
        super(plateNum);
    }
}