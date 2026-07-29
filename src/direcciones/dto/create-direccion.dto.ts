import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateDireccionDto {
  @ApiProperty({ example: 'Casa' })
  @IsNotEmpty({ message: 'El campo etiqueta es obligatorio' })
  @IsString({ message: 'El campo etiqueta debe ser de tipo cadena' })
  @MaxLength(30, {
    message: 'El campo etiqueta no debe superar los 30 caracteres',
  })
  @Transform(({ value }): string | undefined =>
    typeof value === 'string' ? value.trim() : value,
  )
  readonly etiqueta: string;

  @ApiProperty({ example: 'Av. Arce, Edificio Los Pinos, La Paz' })
  @IsNotEmpty({ message: 'El campo dirección es obligatorio' })
  @IsString({ message: 'El campo dirección debe ser de tipo cadena' })
  @MaxLength(255, {
    message: 'El campo dirección no debe superar los 255 caracteres',
  })
  @Transform(({ value }): string | undefined =>
    typeof value === 'string' ? value.trim() : value,
  )
  readonly direccion: string;

  @ApiProperty({ required: false, example: 'Portón negro, casa esquinera' })
  @IsOptional()
  @IsString({ message: 'El campo referencia debe ser de tipo cadena' })
  @MaxLength(255, {
    message: 'El campo referencia no debe superar los 255 caracteres',
  })
  @Transform(({ value }): string | undefined =>
    typeof value === 'string' ? value.trim() : value,
  )
  readonly referencia?: string;

  @ApiProperty({ required: false, example: -16.5 })
  @IsOptional()
  @IsNumber({}, { message: 'El campo latitud debe ser numérico' })
  readonly latitud?: number;

  @ApiProperty({ required: false, example: -68.15 })
  @IsOptional()
  @IsNumber({}, { message: 'El campo longitud debe ser numérico' })
  readonly longitud?: number;

  @ApiProperty({
    required: false,
    description: 'Marca esta dirección como la principal del cliente',
  })
  @IsOptional()
  @IsBoolean({ message: 'El campo principal debe ser booleano' })
  readonly principal?: boolean;
}
