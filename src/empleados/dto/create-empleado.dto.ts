import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateEmpleadoDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'El campo cedula Identidad es obligatorio' })
  @IsString({
    message: 'El campo cedula Identidad debe ser de tipo cadena',
  })
  @MaxLength(12, {
    message: 'El campo cedula Identidad no debe ser mayor a 12 caracteres',
  })
  readonly cedulaIdentidad: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'El campo nombre es obligatorio' })
  @IsString({
    message: 'El campo nombre debe ser de tipo cadena',
  })
  @MaxLength(50, {
    message: 'El campo nombre no debe ser mayor a 12 caracteres',
  })
  readonly nombre: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'El campo apellido Paterno es obligatorio' })
  @IsString({
    message: 'El campo apellido Paterno debe ser de tipo cadena',
  })
  @MaxLength(50, {
    message: 'El campo apellido Paterno no debe ser mayor a 12 caracteres',
  })
  readonly apellidoPaterno: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'El campo apellido materno es obligatorio' })
  @IsString({
    message: 'El campo apellido materno debe ser de tipo cadena',
  })
  @MaxLength(50, {
    message: 'El campo apellido materno no debe ser mayor a 12 caracteres',
  })
  readonly apellidoMaterno: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'El campo fecha nacimiento es obligatorio' })
  readonly fechaNacimiento: Date;

  @ApiProperty()
  @IsNotEmpty({ message: 'El campo direccion es obligatorio' })
  @IsString({
    message: 'El campo direccion debe ser de tipo cadena',
  })
  @MaxLength(80, {
    message: 'El campo direccion no debe ser mayor a 12 caracteres',
  })
  readonly direccion: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'El campo celular es obligatorio' })
  @IsString({ message: 'El campo celular debe ser de tipo cadena' })
  @MaxLength(70, {
    message: 'El campo celular no debe ser mayor a 70 caracteres',
  })
  readonly celular: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'El campo email es obligatorio' })
  @IsString({ message: 'El campo email debe ser de tipo cadena' })
  @MaxLength(70, {
    message: 'El campo email no debe ser mayor a 70 caracteres',
  })
  readonly email: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'El campo cargo es obligatorio' })
  @IsString({ message: 'El campo cargo debe ser de tipo cadena' })
  @MaxLength(15, {
    message: 'El campo cargo no debe ser mayor a 15 caracteres',
  })
  readonly cargo: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'El campo salario es obligatorio' })
  readonly salario: number;

  @ApiProperty()
  @IsNotEmpty({ message: 'El campo fecha ingreso es obligatorio' })
  readonly fechaIngreso: Date;

  @ApiProperty()
  @IsNotEmpty({ message: 'El campo activo es obligatorio' })
  readonly activo: boolean;
}
