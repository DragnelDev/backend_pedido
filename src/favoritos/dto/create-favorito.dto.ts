import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsInt, Min } from 'class-validator';

export class CreateFavoritoDto {
  @ApiProperty({
    description: 'Identificador del producto a guardar',
    example: 1,
  })
  @IsDefined({ message: 'El campo idProducto debe estar definido' })
  @IsInt({ message: 'El campo idProducto debe ser numérico' })
  @Min(1, { message: 'El campo idProducto no es válido' })
  readonly idProducto: number;
}
