import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsuariosService } from 'src/usuarios/usuarios.service';
import { AuthLoginDto } from './dto/auth-login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { Usuario } from 'src/usuarios/entities/usuario.entity';

@Injectable()
export class AuthService {
  constructor(
    private usuarioService: UsuariosService,
    private jwtService: JwtService,
  ) {}

  async login(authLoginDto: AuthLoginDto): Promise<any> {
    const { email, clave } = authLoginDto;

    // 1. Desestructuramos la respuesta del servicio de usuarios para separar el "usuario" de la bandera
    const { usuario, debeCambiarClave } = await this.usuarioService.validate(
      email,
      clave,
    );

    // 2. Armamos el payload del JWT utilizando el objeto "usuario" extraído
    // Obtenemos nombre y apellidos según el rol (empleado o cliente)
    let nombre = '';
    let apellidos = '';
    
    if (usuario.empleado) {
      nombre = usuario.empleado.nombre || '';
      apellidos = `${usuario.empleado.apellidoPaterno || ''} ${usuario.empleado.apellidoMaterno || ''}`.trim();
    } else if (usuario.cliente) {
      nombre = usuario.cliente.nombre || '';
    }

    const payload = {
      id: usuario.id,
      sub: usuario.id,
      rol: usuario.rol,
      email: usuario.email,
      nombre,
      apellidos,
      imagenUrl: usuario.imagenUrl || '',
    };
    const access_token = await this.getAccessToken(payload);

    // 3. Construimos el objeto seguro del usuario para el frontend
    const usuarioSafe = {
      id: usuario.id,
      idEmpleado: usuario.idEmpleado,
      idCliente: usuario.idCliente,
      email: usuario.email,
      rol: usuario.rol,
    };

    // 4. Retornamos todo, incluyendo la bandera 'debeCambiarClave' y el objeto 'user' estructurado
    return {
      user: usuarioSafe,
      access_token,
      debeCambiarClave,
    };
  }

  async getAccessToken(payload: JwtPayload) {
    type StringValue = `${number}s`;
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_TOKEN,
      expiresIn: process.env.JWT_TOKEN_EXPIRATION as StringValue,
    });
    return accessToken;
  }

  async verifyPayload(payload: JwtPayload): Promise<Usuario> {
    let usuario: Usuario;

    try {
      usuario = await this.usuarioService.findOne(payload.sub);
    } catch {
      throw new UnauthorizedException(`Usuario inválido: ${payload.sub}`);
    }

    return usuario;
  }
}
