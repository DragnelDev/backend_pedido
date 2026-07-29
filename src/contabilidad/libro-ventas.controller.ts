import {
  Controller,
  ForbiddenException,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LibroVentasService } from './libro-ventas.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Usuario } from 'src/usuarios/entities/usuario.entity';

@ApiTags('contabilidad - libro de ventas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('libro-ventas')
export class LibroVentasController {
  constructor(private readonly libroVentasService: LibroVentasService) {}

  @Get()
  listar(
    @Query('mes') mes: string | undefined,
    @CurrentUser() usuario: Usuario,
  ) {
    if (!usuario.idEmpleado) {
      throw new ForbiddenException(
        'Solo el personal de la pastelería puede acceder a esta información',
      );
    }
    return this.libroVentasService.listar(mes);
  }
}
