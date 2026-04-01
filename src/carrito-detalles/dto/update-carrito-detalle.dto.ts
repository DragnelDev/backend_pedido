import { PartialType } from '@nestjs/swagger';
import { CreateCarritoDetalleDto } from './create-carrito-detalle.dto';

export class UpdateCarritoDetalleDto extends PartialType(
  CreateCarritoDetalleDto,
) {}
