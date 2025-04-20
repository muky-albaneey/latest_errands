// update-location.dto.ts
import { IsNumber } from 'class-validator';

export class UpdateLocationDto {
  @IsNumber()
  initialLat: number;

  @IsNumber()
  initialLong: number;
}
