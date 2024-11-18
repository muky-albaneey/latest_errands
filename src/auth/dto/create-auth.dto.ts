/* eslint-disable prettier/prettier */
// import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '../entities/auth.entity';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';


export class CreateAuthDto {
  @IsNotEmpty()
  @IsString()
  readonly phoneNumber: string;

  @IsNotEmpty()
  @IsEmail()
  readonly email: string;

  @IsNotEmpty()
  @MinLength(6)
  readonly password: string;

  @IsOptional()
  @IsString()
  readonly fname?: string;

  @IsOptional()
  @IsString()
  readonly lname?: string;

  @IsOptional()
  @IsEnum(UserRole)
  readonly role?: UserRole;
}

export class LoginAuthDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;
  
    @IsNotEmpty()
    @MinLength(6)
    password: string;
  }