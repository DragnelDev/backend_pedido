import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

class MetodoQrDto {
  @ApiProperty() @IsBoolean() activo: boolean;
  @ApiProperty() @IsOptional() @IsString() @MaxLength(100) banco?: string;
  @ApiProperty() @IsOptional() @IsString() @MaxLength(100) titular?: string;
  @ApiProperty() @IsOptional() @IsString() @MaxLength(500) imagenQrUrl?: string;
}

class MetodoTransferenciaDto {
  @ApiProperty() @IsBoolean() activo: boolean;
  @ApiProperty() @IsOptional() @IsString() @MaxLength(100) banco?: string;
  @ApiProperty() @IsOptional() @IsString() @MaxLength(50) tipoCuenta?: string;
  @ApiProperty() @IsOptional() @IsString() @MaxLength(50) numeroCuenta?: string;
  @ApiProperty() @IsOptional() @IsString() @MaxLength(100) titular?: string;
  @ApiProperty() @IsOptional() @IsString() @MaxLength(20) ciNit?: string;
}

class MetodoEfectivoDto {
  @ApiProperty() @IsBoolean() activo: boolean;
  @ApiProperty() @IsOptional() @IsString() @MaxLength(255) descripcion?: string;
}

class MetodosPagoDto {
  @ApiProperty({ type: MetodoQrDto })
  @ValidateNested()
  @Type(() => MetodoQrDto)
  qr: MetodoQrDto;

  @ApiProperty({ type: MetodoTransferenciaDto })
  @ValidateNested()
  @Type(() => MetodoTransferenciaDto)
  transferencia: MetodoTransferenciaDto;

  @ApiProperty({ type: MetodoEfectivoDto })
  @ValidateNested()
  @Type(() => MetodoEfectivoDto)
  efectivo: MetodoEfectivoDto;
}

export class UpdateConfiguracionDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nombre?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  nit?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  direccion?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefonoWhatsapp?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail({}, { message: 'El campo emailContacto debe ser un correo válido' })
  emailContacto?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  logoUrl?: string;

  @ApiProperty({ required: false, type: MetodosPagoDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => MetodosPagoDto)
  metodosPago?: MetodosPagoDto;
}
