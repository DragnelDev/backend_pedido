import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  MaxLength,
  IsNumber,
  IsOptional,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  Validate,
} from 'class-validator';

@ValidatorConstraint({ name: 'atLeastOneIdRequired', async: false })
export class AtLeastOneIdConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const object = args.object as Record<string, any>;
    return Boolean(object.idEmpleado || object.idCliente);
  }

  defaultMessage() {
    return 'Debe proporcionar al menos un idEmpleado o un idCliente';
  }
}

export class CreateUsuarioDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber({}, { message: 'El campo idEmpleado debe ser de tipo número' })
  readonly idEmpleado?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber({}, { message: 'El campo idCliente debe ser de tipo número' })
  @Validate(AtLeastOneIdConstraint)
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

  @ApiProperty()
  @IsNotEmpty({ message: 'El campo email es obligatorio' })
  @IsString({ message: 'El campo email debe ser de tipo cadena' })
  @MaxLength(100, {
    message: 'El campo email no debe ser mayor a 100 caracteres',
  })
  @Transform(({ value }): string | undefined =>
    typeof value === 'string' ? value.trim() : value,
  )
  readonly email: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'El campo rol es obligatorio' })
  @IsString({ message: 'El campo rol debe ser de tipo cadena' })
  @MaxLength(20, {
    message: 'El campo rol no debe ser mayor a 20 caracteres',
  })
  @Transform(({ value }): string | undefined =>
    typeof value === 'string' ? value.trim() : value,
  )
  readonly rol: string;
}
