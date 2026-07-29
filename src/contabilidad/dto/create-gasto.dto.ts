import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';
import { CATEGORIAS_GASTO } from '../entities/gasto.entity';
import type { CategoriaGasto } from '../entities/gasto.entity';

export class CreateGastoDto {
  @ApiProperty({
    required: false,
    description: 'Fecha del gasto (YYYY-MM-DD). Por defecto, hoy.',
  })
  @IsOptional()
  @IsDateString({}, { message: 'El campo fecha debe tener formato YYYY-MM-DD' })
  readonly fecha?: string;

  @ApiProperty({ example: 'Compra de frutillas y moras' })
  @IsNotEmpty({ message: 'El campo concepto es obligatorio' })
  @IsString({ message: 'El campo concepto debe ser de tipo cadena' })
  @MaxLength(150, {
    message: 'El campo concepto no debe superar los 150 caracteres',
  })
  @Transform(({ value }): string | undefined =>
    typeof value === 'string' ? value.trim() : value,
  )
  readonly concepto: string;

  @ApiProperty({ enum: CATEGORIAS_GASTO, example: 'insumos' })
  @IsIn(CATEGORIAS_GASTO, {
    message: `El campo categoría debe ser uno de: ${CATEGORIAS_GASTO.join(', ')}`,
  })
  readonly categoria: CategoriaGasto;

  @ApiProperty({ required: false, example: 'Factura #123' })
  @IsOptional()
  @IsString({ message: 'El campo comprobante debe ser de tipo cadena' })
  @MaxLength(100, {
    message: 'El campo comprobante no debe superar los 100 caracteres',
  })
  @Transform(({ value }): string | undefined =>
    typeof value === 'string' ? value.trim() : value,
  )
  readonly comprobante?: string;

  @ApiProperty({ example: 140.0 })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El campo monto debe ser numérico' },
  )
  @IsPositive({ message: 'El campo monto debe ser mayor a 0' })
  readonly monto: number;
}
