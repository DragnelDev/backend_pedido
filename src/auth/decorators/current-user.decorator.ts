import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Usuario } from 'src/usuarios/entities/usuario.entity';

/**
 * Extrae el usuario autenticado (adjuntado por JwtStrategy) desde el request.
 *
 * Uso:
 *   @Get('perfil')
 *   @UseGuards(JwtAuthGuard)
 *   perfil(@CurrentUser() usuario: Usuario) { ... }
 *
 *   // o para obtener solo un campo puntual:
 *   @CurrentUser('id') idUsuario: number
 */
export const CurrentUser = createParamDecorator(
  (data: keyof Usuario | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const usuario: Usuario = request.user;
    return data ? usuario?.[data] : usuario;
  },
);
