import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DireccionesService } from './direcciones.service';
import { CreateDireccionDto } from './dto/create-direccion.dto';
import { UpdateDireccionDto } from './dto/update-direccion.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Usuario } from 'src/usuarios/entities/usuario.entity';

/**
 * Gestión de direcciones de entrega del cliente autenticado.
 * Relación 1:N con Cliente (un cliente puede tener múltiples direcciones,
 * ej. Casa, Oficina, y marcar una de ellas como principal).
 */
@ApiTags('direcciones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('direcciones')
export class DireccionesController {
  constructor(private readonly direccionesService: DireccionesService) {}

  @Get('mias')
  findMias(@CurrentUser() usuario: Usuario) {
    return this.direccionesService.findAllByCliente(
      this.obtenerIdCliente(usuario),
    );
  }

  @Post()
  create(
    @CurrentUser() usuario: Usuario,
    @Body() createDireccionDto: CreateDireccionDto,
  ) {
    return this.direccionesService.create(
      this.obtenerIdCliente(usuario),
      createDireccionDto,
    );
  }

  @Patch(':id')
  update(
    @CurrentUser() usuario: Usuario,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDireccionDto: UpdateDireccionDto,
  ) {
    return this.direccionesService.update(
      id,
      this.obtenerIdCliente(usuario),
      updateDireccionDto,
    );
  }

  @Patch(':id/principal')
  marcarPrincipal(
    @CurrentUser() usuario: Usuario,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.direccionesService.marcarComoPrincipal(
      id,
      this.obtenerIdCliente(usuario),
    );
  }

  @Delete(':id')
  remove(
    @CurrentUser() usuario: Usuario,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.direccionesService.remove(id, this.obtenerIdCliente(usuario));
  }

  // Solo los usuarios con rol CLIENTE (y su registro de cliente asociado)
  // pueden gestionar direcciones de entrega.
  private obtenerIdCliente(usuario: Usuario): number {
    if (!usuario.idCliente) {
      throw new ForbiddenException(
        'Solo los clientes pueden gestionar direcciones de entrega',
      );
    }
    return usuario.idCliente;
  }
}
