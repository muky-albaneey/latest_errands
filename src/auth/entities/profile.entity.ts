/* eslint-disable prettier/prettier */
import { Entity, JoinColumn, OneToOne } from 'typeorm';
import { AbstractFileEntity } from './abstract.entity';
import { User } from './auth.entity';

@Entity()
export class ProfileImage extends AbstractFileEntity<ProfileImage> {


    @OneToOne(() => User, (user) => user.Profile_img, { onDelete: 'CASCADE' })
    @JoinColumn()
    user: User;
    
    constructor(profileImage: Partial<ProfileImage>) {
        super(profileImage);
    }
}