import { IsEmail, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateOrderWithPaymentDto {
  // @IsEmail()
  // email: string;

  @IsString()
  @IsNotEmpty()
  recipientName: string;

  @IsString()
  @IsNotEmpty()
  recipientPhone: string;

  @IsString()
  @IsNotEmpty()
  destination: string;

  @IsEnum(['Fragile', 'Standard', 'Perishable'])
  packageCategory: string;

  @IsOptional()
  @IsEnum(['Cooler', 'Warmer'])
  perishableType?: string;

  @IsString()
  @IsNotEmpty()
  packageDescription: string;

  @IsOptional()
  packageImages?: string[];

  @IsString()
  @IsNotEmpty()
  vehicleSize: string;

  @IsNumber()
  cost: number;

  @IsEnum(['Cash', 'Card'])
  paymentType: string;

  @IsOptional()
  status?: string;
}
