import { IsOptional, IsObject, ValidateNested, IsNumber, IsString, MaxLength } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class UpdateClienteDataDto {
  @IsOptional()
  @IsString()
  readonly nombre?: string;

  @IsOptional()
  @IsString()
  readonly apellidoPaterno?: string;

  @IsOptional()
  @IsString()
  readonly apellidoMaterno?: string;

  @IsOptional()
  @IsString()
  readonly celular?: string;

  @IsOptional()
  @IsString()
  readonly direccion?: string;
}

export class UpdateUsuarioDto {
  @IsOptional()
  @IsNumber({}, { message: 'El campo idEmpleado debe ser de tipo número' })
  readonly idEmpleado?: number;

  @IsOptional()
  @IsNumber({}, { message: 'El campo idCliente debe ser de tipo número' })
  readonly idCliente?: number;

  @IsOptional()
  @IsString({ message: 'El campo imagen_url debe ser de tipo cadena' })
  @MaxLength(500, {
    message: 'El campo imagen_url no debe superar los 500 caracteres',
  })
  @Transform(({ value }): string | undefined =>
    typeof value === 'string' ? value.trim() : value,
  )
  readonly imagenUrl?: string;

  @IsOptional()
  @IsString({ message: 'El campo email debe ser de tipo cadena' })
  @MaxLength(100, {
    message: 'El campo email no debe ser mayor a 100 caracteres',
  })
  @Transform(({ value }): string | undefined =>
    typeof value === 'string' ? value.trim() : value,
  )
  readonly email?: string;

  @IsOptional()
  @IsString({ message: 'El campo rol debe ser de tipo cadena' })
  @MaxLength(20, {
    message: 'El campo rol no debe ser mayor a 20 caracteres',
  })
  @Transform(({ value }): string | undefined =>
    typeof value === 'string' ? value.trim() : value,
  )
  readonly rol?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => UpdateClienteDataDto)
  readonly cliente?: UpdateClienteDataDto;
}
