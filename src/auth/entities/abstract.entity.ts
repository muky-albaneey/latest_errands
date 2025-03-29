/* eslint-disable prettier/prettier */
import {PrimaryGeneratedColumn, Column } from 'typeorm';


export class AbstractFileEntity<T> {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  url: string;  // Store the URL of the uploaded file

  @Column()
  ext: string;  // Store the file extension


  constructor(entity : Partial<T>){
    Object.assign(this, entity)
}

}