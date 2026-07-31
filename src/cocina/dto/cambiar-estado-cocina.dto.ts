import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export const ESTADOS_COCINA = ['pendiente', 'en_preparacion', 'listo', 'entregado'] as const;
export type EstadoCocina = (typeof ESTADOS_COCINA)[number];

export class CambiarEstadoCocinaDto {
  @ApiProperty({ enum: ESTADOS_COCINA, example: 'en_preparacion' })
  @IsIn(ESTADOS_COCINA, {
    message: `El campo estado debe ser uno de: ${ESTADOS_COCINA.join(', ')}`,
  })
  readonly estado: EstadoCocina;
}
