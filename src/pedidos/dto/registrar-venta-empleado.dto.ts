import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class ItemVentaEmpleadoDto {
  @IsInt()
  @Min(1)
  idProducto!: number;

  @IsInt()
  @Min(1)
  cantidad!: number;
}

export class ClienteVentaEmpleadoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(12)
  cedulaIdentidad!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  nombre!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  apellidoPaterno!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  apellidoMaterno?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(12)
  celular!: string;

  @IsEmail()
  @MaxLength(40)
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  direccion?: string;
}

export class RegistrarVentaEmpleadoDto {
  @IsIn(['mostrador', 'reserva', 'domicilio'])
  modo!: 'mostrador' | 'reserva' | 'domicilio';

  @IsIn(['efectivo', 'qr', 'transferencia', 'tarjeta'])
  metodoPago!: 'efectivo' | 'qr' | 'transferencia' | 'tarjeta';

  @IsOptional()
  @IsIn(['inmediato', 'programado'])
  modalidadEntrega?: 'inmediato' | 'programado';

  @IsString()
  @MaxLength(20)
  tipoEnvio!: string;

  @IsOptional()
  @IsDateString()
  fechaEntrega?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  direccionEnvio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  referencia?: string;

  @IsOptional()
  @IsNumber()
  latitud?: number;

  @IsOptional()
  @IsNumber()
  longitud?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => ClienteVentaEmpleadoDto)
  cliente?: ClienteVentaEmpleadoDto;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  comprobante?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\*{0,12}\d{4}$/)
  maskedCard?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ItemVentaEmpleadoDto)
  items!: ItemVentaEmpleadoDto[];
}
