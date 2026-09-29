import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class AjustarStockProductoDto {
  @ApiProperty({
    example: 12,
    description: 'Unidades listas para vender que se agregan al stock',
  })
  @IsInt({ message: 'La cantidad debe ser un número entero' })
  @IsPositive({ message: 'La cantidad debe ser mayor a 0' })
  readonly cantidad!: number;
}
