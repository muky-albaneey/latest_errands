import { IsString, IsNumber, IsOptional, IsUUID } from 'class-validator';

export class CreateVehicleDto {
  @IsString()
  vehicleType: string;

  @IsString()
  vehicleBrand: string;

  @IsString()
  vehicleYear: string;

  @IsString()
  vehicleColor: string;

  @IsString()
  licensePlate: string;

  @IsNumber()
  vehicleCapacity: number;

  @IsString()
  unit: string;

  @IsOptional()
  @IsString()
  specialEquipment?: string;
}

export class UpdateVehicleDto {
  @IsOptional()
  @IsString()
  vehicleType?: string;

  @IsOptional()
  @IsString()
  vehicleBrand?: string;

  @IsOptional()
  @IsString()
  vehicleYear?: string;

  @IsOptional()
  @IsString()
  vehicleColor?: string;

  @IsOptional()
  @IsString()
  licensePlate?: string;

  @IsOptional()
  @IsNumber()
  vehicleCapacity?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsString()
  specialEquipment?: string;
}
