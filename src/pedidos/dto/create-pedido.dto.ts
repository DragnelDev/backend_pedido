import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDefined,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreatePedidoDto {
  @ApiProperty({
    description: 'Identificador del usuario que realiza el pedido',
    example: 1,
  })
  @IsDefined({ message: 'El campo id del Usuario debe estar definido' })
  @IsInt({ message: 'El campo id del Usuario debe ser numérico' })
  idUsuario: number;

  @ApiProperty({
    description: 'Fecha de entrega del pedido',
    example: '2024-01-15T10:00:00Z',
  })
  @IsDefined({ message: 'El campo fechaEntrega debe estar definido' })
  @Transform(({ value }): Date => new Date(value as string | number | Date))
  fechaEntrega: Date;

  /*@ApiProperty({
    description: 'Tipo de entrega de pedido',
    example: 'a domicilio',
  })
  @IsDefined({ message: 'El campo tipoEntrega debe estar definido' })
  @IsString({ message: 'El campo tipoEntrega debe ser una cadena' })
  @MaxLength(20, {
    message: 'El campo tipoEntrega no debe exceder los 20 caracteres',
  })
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.trim() : value,
  )
  tipoEntrega: string;*/

  @ApiProperty({
    description: 'Monto total del pedido',
    example: 150.75,
  })
  @IsDefined({ message: 'El campo total debe estar definido' })
  @IsNumber({}, { message: 'El campo total debe ser numérico' })
  @Min(0, { message: 'El campo total no puede ser negativo' })
  total: number;

  @ApiProperty({
    description: 'Estado del pedido',
    example: 'pendiente',
  })
  @IsOptional()
  @IsString({ message: 'El campo estado debe ser una cadena' })
  @MaxLength(20, {
    message: 'El campo estado no debe exceder los 20 caracteres',
  })
  @Transform(({ value }): string | undefined =>
    typeof value === 'string' ? value.trim() : value,
  )
  estado?: string;

  @ApiProperty({
    description: 'Dirección completa de entrega del pedido',
    example: 'Calle Tomina #123, Zona Central',
  })
  @IsOptional()
  @IsString({ message: 'El campo dirección debe ser una cadena' })
  @MaxLength(255, {
    message: 'El campo dirección no debe exceder los 255 caracteres',
  })
  @Transform(({ value }): string | undefined =>
    typeof value === 'string' ? value.trim() : value,
  )
  direccionEnvio?: string;

  @ApiProperty({
    description: 'Referencia de la dirección',
    example: 'Casa verde, portón negro',
  })
  @IsOptional()
  @IsString({ message: 'El campo referencia debe ser una cadena' })
  @MaxLength(255, {
    message: 'El campo referencia no debe exceder 255 caracteres',
  })
  @Transform(({ value }): string | undefined =>
    typeof value === 'string' ? value.trim() : value,
  )
  referencia?: string;

  @ApiProperty({
    description: 'Tipo de envío seleccionado',
    example: 'rápido',
  })
  @IsOptional()
  @IsString({ message: 'El campo tipoEnvio debe ser una cadena' })
  @MaxLength(20, {
    message: 'El campo tipoEnvio no debe exceder los 20 caracteres',
  })
  @Transform(({ value }): string | undefined =>
    typeof value === 'string' ? value.trim() : value,
  )
  tipoEnvio?: string;

  @ApiProperty({
    description: 'Método de pago del pedido',
    example: 'transferencia',
  })
  @IsOptional()
  @IsString({ message: 'El campo metodoPago debe ser una cadena' })
  @MaxLength(20, {
    message: 'El campo metodoPago no debe exceder los 20 caracteres',
  })
  @Transform(({ value }): string | undefined =>
    typeof value === 'string' ? value.trim() : value,
  )
  metodoPago?: string;
}
