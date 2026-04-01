import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsInt, IsNotEmpty, Max, Min } from 'class-validator';

export class CreateCarritoDetalleDto {
  @ApiProperty()
  @IsDefined({ message: 'El campo id del Producto debe estar definido' })
  @IsInt({ message: 'El campo id del Producto debe ser numérico' })
  idProducto: number;

  @ApiProperty()
  @IsDefined({ message: 'El campo id del Producto debe estar definido' })
  @IsInt({ message: 'El campo id del Producto debe ser numérico' })
  idCarrito: number;

  @ApiProperty()
  @IsNotEmpty({ message: 'El campo cantidad no debe estar vacío' })
  @IsInt({ message: 'El campo cantidad debe ser un número entero' })
  @Min(1, { message: 'La cantidad mínima permitida es 1' })
  @Max(100, { message: 'La cantidad máxima permitida es 100' })
  cantidad: number;

  @ApiProperty()
  precioUnitario: number;

  @ApiProperty()
  subTotal: number;
}
