import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CambiarClaveDto {
  @IsString({ message: 'La contraseña actual debe ser un texto.' })
  @IsNotEmpty({ message: 'La contraseña actual es requerida.' })
  claveActual: string;

  @IsString({ message: 'La nueva contraseña debe ser un texto.' })
  @IsNotEmpty({ message: 'La nueva contraseña es requerida.' })
  @MinLength(6, {
    message: 'La nueva contraseña debe tener al menos 6 caracteres.',
  })
  nuevaClave: string;
}
