import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GoogleLoginDto {
  @ApiProperty({
    description: 'Credential (ID token) entregado por el botón de Google Identity Services',
  })
  @IsNotEmpty({ message: 'El campo idToken no debe estar vacío' })
  @IsString({ message: 'El campo idToken debe ser de tipo cadena' })
  readonly idToken: string;
}
