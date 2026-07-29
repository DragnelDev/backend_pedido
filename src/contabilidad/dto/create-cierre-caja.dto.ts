import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateCierreCajaDto {
  @ApiProperty({
    description: 'Día que se está cerrando (YYYY-MM-DD)',
    example: '2026-07-27',
  })
  @IsDateString({}, { message: 'El campo fecha debe tener formato YYYY-MM-DD' })
  readonly fecha: string;

  @ApiProperty({
    description: 'Fondo con el que se abrió la caja',
    example: 200.0,
  })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El campo montoInicial debe ser numérico' },
  )
  @Min(0, { message: 'El campo montoInicial no puede ser negativo' })
  readonly montoInicial: number;

  @ApiProperty({
    description: 'Efectivo contado físicamente en caja',
    example: 1050.0,
  })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El campo efectivoContado debe ser numérico' },
  )
  @Min(0, { message: 'El campo efectivoContado no puede ser negativo' })
  readonly efectivoContado: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'El campo observaciones debe ser de tipo cadena' })
  @MaxLength(500, {
    message: 'El campo observaciones no debe superar los 500 caracteres',
  })
  readonly observaciones?: string;
}
