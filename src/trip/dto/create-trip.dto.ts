import { IsNumber, IsOptional } from 'class-validator';

export class CreateTripDto {
  @IsNumber()
  initialLat: number;

  @IsNumber()
  initialLong: number;

  @IsOptional()
  @IsNumber()
  finalLat?: number;

  @IsOptional()
  @IsNumber()
  finalLong?: number;
}
