import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, IsPositive, Min, ValidateNested } from 'class-validator';

class ItemRecetaDto {
  @ApiProperty({ example: 1 })
  @IsInt({ message: 'El campo idInsumo debe ser numérico' })
  @IsPositive({ message: 'El campo idInsumo no es válido' })
  readonly idInsumo: number;

  @ApiProperty({ example: 0.25 })
  @Min(0.001, { message: 'El campo cantidadPorUnidad debe ser mayor a 0' })
  readonly cantidadPorUnidad: number;
}

export class ReemplazarRecetaDto {
  @ApiProperty({ type: [ItemRecetaDto] })
  @IsArray({ message: 'El campo items debe ser un arreglo' })
  @ArrayMinSize(1, { message: 'La receta debe tener al menos un insumo' })
  @ValidateNested({ each: true })
  @Type(() => ItemRecetaDto)
  readonly items: ItemRecetaDto[];
}
