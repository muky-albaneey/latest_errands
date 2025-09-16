/* eslint-disable prettier/prettier */
// src/ws/dto/rider-location.dto.ts
import { IsNumber, ValidateNested } from 'class-validator';
class Coords { @IsNumber() lat: number; @IsNumber() lng: number; }
export class RiderLocationDto { @ValidateNested() coords: Coords; }
