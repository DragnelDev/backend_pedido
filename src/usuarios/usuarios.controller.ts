import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { CambiarClaveDto } from './dto/cambiar-clave.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post()
  create(@Body() createUsuarioDto: CreateUsuarioDto) {
    return this.usuariosService.create(createUsuarioDto);
  }

  @Get()
  findAll() {
    return this.usuariosService.findAll();
  }

  // Perfil del usuario autenticado (GET /usuarios/perfil, PATCH /usuarios/perfil)
  // Declarado antes de ':id' para que 'perfil' no sea interpretado como un id.
  @ApiBearerAuth()
  @Get('perfil')
  @UseGuards(JwtAuthGuard)
  obtenerPerfil(@CurrentUser('id') idUsuario: number) {
    return this.usuariosService.findOne(idUsuario);
  }

  @ApiBearerAuth()
  @Patch('perfil')
  @UseGuards(JwtAuthGuard)
  actualizarPerfil(
    @CurrentUser('id') idUsuario: number,
    @Body() updateUsuarioDto: UpdateUsuarioDto,
  ) {
    return this.usuariosService.update(idUsuario, updateUsuarioDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usuariosService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUsuarioDto: UpdateUsuarioDto) {
    return this.usuariosService.update(+id, updateUsuarioDto);
  }

  @Put(':id')
  replace(@Param('id') id: string, @Body() updateUsuarioDto: UpdateUsuarioDto) {
    return this.usuariosService.update(+id, updateUsuarioDto);
  }

  @Patch(':id/cambiar-clave')
  @UseGuards(JwtAuthGuard)
  async cambiarClave(
    @Param('id', ParseIntPipe) id: number,
    @Body() cambiarClaveDto: CambiarClaveDto,
    @Request() req: any,
  ) {
    // Validar que el usuario solo puede cambiar su propia contraseña
    if (req.user.id !== id) {
      throw new UnauthorizedException(
        'No puedes cambiar la contraseña de otro usuario',
      );
    }
    return this.usuariosService.cambiarClave(id, cambiarClaveDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usuariosService.remove(+id);
  }
}
