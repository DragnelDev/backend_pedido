import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CocinaService } from './cocina.service';
import { CambiarEstadoCocinaDto } from './dto/cambiar-estado-cocina.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Usuario } from 'src/usuarios/entities/usuario.entity';

@ApiTags('cocina')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cocina')
export class CocinaController {
  constructor(private readonly cocinaService: CocinaService) {}

  @Get('pedidos')
  tablero(@CurrentUser() usuario: Usuario) {
    this.verificarEmpleado(usuario);
    return this.cocinaService.tablero();
  }

  @Patch('pedidos/:id/estado')
  cambiarEstado(
    @CurrentUser() usuario: Usuario,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CambiarEstadoCocinaDto,
  ) {
    this.verificarEmpleado(usuario);
    return this.cocinaService.cambiarEstado(id, dto.estado);
  }

  private verificarEmpleado(usuario: Usuario): void {
    if (!usuario.idEmpleado) {
      throw new ForbiddenException('Solo el personal de la pastelería puede acceder a esta información');
    }
  }
}
