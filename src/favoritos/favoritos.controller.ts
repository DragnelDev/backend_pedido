import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FavoritosService } from './favoritos.service';
import { CreateFavoritoDto } from './dto/create-favorito.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Usuario } from 'src/usuarios/entities/usuario.entity';

/**
 * Lista de deseos / favoritos del cliente autenticado.
 * Relación N:M entre Cliente y Producto.
 */
@ApiTags('favoritos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('favoritos')
export class FavoritosController {
  constructor(private readonly favoritosService: FavoritosService) {}

  @Get('mios')
  findMios(@CurrentUser() usuario: Usuario) {
    return this.favoritosService.findAllByCliente(
      this.obtenerIdCliente(usuario),
    );
  }

  @Post()
  agregar(
    @CurrentUser() usuario: Usuario,
    @Body() createFavoritoDto: CreateFavoritoDto,
  ) {
    return this.favoritosService.agregar(
      this.obtenerIdCliente(usuario),
      createFavoritoDto,
    );
  }

  @Delete(':idProducto')
  eliminar(
    @CurrentUser() usuario: Usuario,
    @Param('idProducto', ParseIntPipe) idProducto: number,
  ) {
    return this.favoritosService.eliminar(
      this.obtenerIdCliente(usuario),
      idProducto,
    );
  }

  private obtenerIdCliente(usuario: Usuario): number {
    if (!usuario.idCliente) {
      throw new ForbiddenException(
        'Solo los clientes pueden gestionar su lista de favoritos',
      );
    }
    return usuario.idCliente;
  }
}
