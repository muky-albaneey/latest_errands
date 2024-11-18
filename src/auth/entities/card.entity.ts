/* eslint-disable prettier/prettier */
import { OneToOne, JoinColumn, OneToMany, ManyToOne, Entity, PrimaryGeneratedColumn, Column } from 'typeorm';


@Entity()
export class Card{
    @PrimaryGeneratedColumn("uuid")
    id: number;

    @Column({nullable : true, length: 190, type: 'varchar'})
    card_name?: string;

    @Column({ type: 'varchar', length: 190, nullable: false })
    card_number: string;

    @Column({ type: 'varchar', length: 190, nullable: false  })
    card_date: string;

    @Column({ type: 'varchar', length: 190, nullable: false  })
    card_digit : string;


    constructor(card :Partial<Card>){
        Object.assign(this, card)
    }
}   