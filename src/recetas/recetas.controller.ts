import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RecetasService } from './recetas.service';
import { ReemplazarRecetaDto } from './dto/reemplazar-receta.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Usuario } from 'src/usuarios/entities/usuario.entity';

@ApiTags('recetas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('productos/:idProducto/receta')
export class RecetasController {
  constructor(private readonly recetasService: RecetasService) {}

  @Get()
  findByProducto(
    @CurrentUser() usuario: Usuario,
    @Param('idProducto', ParseIntPipe) idProducto: number,
  ) {
    this.verificarEmpleado(usuario);
    return this.recetasService.findByProducto(idProducto);
  }

  @Put()
  reemplazar(
    @CurrentUser() usuario: Usuario,
    @Param('idProducto', ParseIntPipe) idProducto: number,
    @Body() dto: ReemplazarRecetaDto,
  ) {
    this.verificarEmpleado(usuario);
    return this.recetasService.reemplazar(idProducto, dto);
  }

  private verificarEmpleado(usuario: Usuario): void {
    if (!usuario.idEmpleado) {
      throw new ForbiddenException('Solo el personal de la pastelería puede acceder a esta información');
    }
  }
}
