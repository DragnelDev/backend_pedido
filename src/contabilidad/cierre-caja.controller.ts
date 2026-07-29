import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CierreCajaService } from './cierre-caja.service';
import { CreateCierreCajaDto } from './dto/create-cierre-caja.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Usuario } from 'src/usuarios/entities/usuario.entity';

/**
 * Arqueo y cierre de caja diario. Solo accesible para usuarios con
 * rol EMPLEADO.
 */
@ApiTags('contabilidad - cierre de caja')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cierres-caja')
export class CierreCajaController {
  constructor(private readonly cierreCajaService: CierreCajaService) {}

  @Get()
  findAll(@CurrentUser() usuario: Usuario) {
    this.verificarEmpleado(usuario);
    return this.cierreCajaService.findAll();
  }

  @Get('resumen-dia')
  resumenDia(
    @Query('fecha') fecha: string | undefined,
    @CurrentUser() usuario: Usuario,
  ) {
    this.verificarEmpleado(usuario);
    return this.cierreCajaService.resumenDia(fecha);
  }

  @Post()
  create(@CurrentUser() usuario: Usuario, @Body() dto: CreateCierreCajaDto) {
    this.verificarEmpleado(usuario);
    return this.cierreCajaService.create(usuario.idEmpleado, dto);
  }

  private verificarEmpleado(usuario: Usuario): void {
    if (!usuario.idEmpleado) {
      throw new ForbiddenException(
        'Solo el personal de la pastelería puede acceder a esta información',
      );
    }
  }
}
