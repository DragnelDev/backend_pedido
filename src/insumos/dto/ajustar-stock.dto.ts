import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNumber, IsOptional, IsString, IsPositive, MaxLength } from 'class-validator';

export const TIPOS_AJUSTE = ['entrada', 'salida'] as const;
export type TipoAjuste = (typeof TIPOS_AJUSTE)[number];

export class AjustarStockDto {
  @ApiProperty({ enum: TIPOS_AJUSTE, example: 'entrada' })
  @IsIn(TIPOS_AJUSTE, { message: `El campo tipo debe ser uno de: ${TIPOS_AJUSTE.join(', ')}` })
  readonly tipo: TipoAjuste;

  @ApiProperty({ example: 5 })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El campo cantidad debe ser numérico' })
  @IsPositive({ message: 'El campo cantidad debe ser mayor a 0' })
  readonly cantidad: number;

  @ApiProperty({ required: false, example: 'Compra a proveedor' })
  @IsOptional()
  @IsString({ message: 'El campo motivo debe ser de tipo cadena' })
  @MaxLength(200, { message: 'El campo motivo no debe superar los 200 caracteres' })
  readonly motivo?: string;
}
