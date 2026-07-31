import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MaxLength,
} from 'class-validator';
import { UNIDADES_MEDIDA } from '../entities/insumo.entity';
import type { UnidadMedida } from '../entities/insumo.entity';

export class CreateInsumoDto {
  @ApiProperty({ example: 'Harina de Trigo' })
  @IsNotEmpty({ message: 'El campo nombre es obligatorio' })
  @IsString({ message: 'El campo nombre debe ser de tipo cadena' })
  @MaxLength(80, { message: 'El campo nombre no debe superar los 80 caracteres' })
  @Transform(({ value }): string | undefined =>
    typeof value === 'string' ? value.trim() : value,
  )
  readonly nombre: string;

  @ApiProperty({ example: 'Secos' })
  @IsNotEmpty({ message: 'El campo categoría es obligatorio' })
  @IsString({ message: 'El campo categoría debe ser de tipo cadena' })
  @MaxLength(40, { message: 'El campo categoría no debe superar los 40 caracteres' })
  @Transform(({ value }): string | undefined =>
    typeof value === 'string' ? value.trim() : value,
  )
  readonly categoria: string;

  @ApiProperty({ enum: UNIDADES_MEDIDA, example: 'kg' })
  @IsIn(UNIDADES_MEDIDA, {
    message: `El campo unidadMedida debe ser uno de: ${UNIDADES_MEDIDA.join(', ')}`,
  })
  readonly unidadMedida: UnidadMedida;

  @ApiProperty({ example: 10 })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El campo stock debe ser numérico' })
  @Min(0, { message: 'El campo stock no puede ser negativo' })
  readonly stock: number;

  @ApiProperty({ example: 5 })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El campo stockMinimo debe ser numérico' })
  @Min(0, { message: 'El campo stockMinimo no puede ser negativo' })
  readonly stockMinimo: number;

  @ApiProperty({ required: false, example: 8.5 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El campo costoUnitario debe ser numérico' })
  @Min(0, { message: 'El campo costoUnitario no puede ser negativo' })
  readonly costoUnitario?: number;
}
