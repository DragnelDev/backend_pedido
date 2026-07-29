import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ConfiguracionService } from './configuracion.service';
import { UpdateConfiguracionDto } from './dto/update-configuracion.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Public } from 'src/auth/decorators/auth-public.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Usuario } from 'src/usuarios/entities/usuario.entity';

@ApiTags('configuracion')
@Controller('configuracion')
export class ConfiguracionController {
  constructor(private readonly configuracionService: ConfiguracionService) {}

  // Pública: el checkout del cliente necesita saber qué métodos de pago
  // están activos y sus datos (QR, cuenta bancaria, etc.)
  @Public()
  @Get()
  obtener() {
    return this.configuracionService.obtener();
  }

  @ApiBearerAuth()
  @Patch()
  @UseGuards(JwtAuthGuard)
  actualizar(
    @CurrentUser() usuario: Usuario,
    @Body() dto: UpdateConfiguracionDto,
  ) {
    if (!usuario.idEmpleado) {
      throw new ForbiddenException(
        'Solo el personal de la pastelería puede modificar la configuración',
      );
    }
    return this.configuracionService.actualizar(dto);
  }
}
