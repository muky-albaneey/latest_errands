/* eslint-disable prettier/prettier */
import { Entity, JoinColumn, OneToOne } from 'typeorm';
import { AbstractFileEntity } from './abstract.entity';
import { User } from './auth.entity';

@Entity()
export class ProfileImage extends AbstractFileEntity<ProfileImage> {


     @OneToOne(() => User)
        @JoinColumn()
        user: User;  // One-to-One relationship with Product

    constructor(profileImage: Partial<ProfileImage>) {
        super(profileImage);
    }
}