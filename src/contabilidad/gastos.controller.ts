import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GastosService } from './gastos.service';
import { CreateGastoDto } from './dto/create-gasto.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Usuario } from 'src/usuarios/entities/usuario.entity';

/**
 * Gestión de gastos/egresos de la pastelería. Solo accesible para
 * usuarios con rol EMPLEADO (personal administrativo/operativo).
 */
@ApiTags('contabilidad - gastos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('gastos')
export class GastosController {
  constructor(private readonly gastosService: GastosService) {}

  @Get()
  findAll(
    @Query('mes') mes: string | undefined,
    @CurrentUser() usuario: Usuario,
  ) {
    this.verificarEmpleado(usuario);
    return this.gastosService.findAll(mes);
  }

  @Get('resumen')
  resumen(
    @Query('mes') mes: string | undefined,
    @CurrentUser() usuario: Usuario,
  ) {
    this.verificarEmpleado(usuario);
    return this.gastosService.resumenMes(mes);
  }

  @Post()
  create(@CurrentUser() usuario: Usuario, @Body() dto: CreateGastoDto) {
    this.verificarEmpleado(usuario);
    return this.gastosService.create(usuario.idEmpleado, dto);
  }

  @Delete(':id')
  remove(
    @CurrentUser() usuario: Usuario,
    @Param('id', ParseIntPipe) id: number,
  ) {
    this.verificarEmpleado(usuario);
    return this.gastosService.remove(id);
  }

  private verificarEmpleado(usuario: Usuario): void {
    if (!usuario.idEmpleado) {
      throw new ForbiddenException(
        'Solo el personal de la pastelería puede acceder a esta información',
      );
    }
  }
}
