import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import { UsuariosService } from 'src/usuarios/usuarios.service';
import { ClientesService } from 'src/clientes/clientes.service';
import { AuthLoginDto } from './dto/auth-login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { Usuario } from 'src/usuarios/entities/usuario.entity';

@Injectable()
export class AuthService {
  // Cliente de verificación de tokens de Google. La 'audience' (GOOGLE_CLIENT_ID)
  // asegura que el token fue emitido específicamente para esta aplicación.
  private readonly googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
  );

  constructor(
    private usuarioService: UsuariosService,
    private clientesService: ClientesService,
    private jwtService: JwtService,
  ) {}

  async login(authLoginDto: AuthLoginDto): Promise<any> {
    const { email, clave } = authLoginDto;

    const { usuario, debeCambiarClave } = await this.usuarioService.validate(
      email,
      clave,
    );

    return this.construirRespuestaLogin(usuario, debeCambiarClave);
  }

  /**
   * Login / auto-registro con Google Identity Services.
   *
   * El frontend obtiene un "credential" (ID token JWT) mediante el botón
   * oficial de Google y lo envía aquí. Este método:
   *  1. Verifica el token directamente contra los servidores de Google
   *     (nunca se confía en datos que el cliente diga que vienen de Google).
   *  2. Si ya existe un usuario con ese email, inicia sesión normalmente.
   *  3. Si no existe, crea un Cliente + Usuario nuevos automáticamente
   *     (rol CLIENTE) usando los datos básicos del perfil de Google.
   */
  async loginWithGoogle(idToken: string): Promise<any> {
    const payloadGoogle = await this.verificarTokenGoogle(idToken);

    let usuario = await this.usuarioService.findByEmail(payloadGoogle.email);
    let esNuevo = false;

    if (usuario && !usuario.activo) {
      throw new UnauthorizedException('Tu cuenta se encuentra inactiva');
    }

    if (!usuario) {
      usuario = await this.registrarUsuarioDesdeGoogle(payloadGoogle);
      esNuevo = true;
    }

    // Un usuario que ya existía con clave local también puede entrar por
    // Google sin problema, siempre que el email coincida (mismo dueño).
    const respuesta = await this.construirRespuestaLogin(usuario, false);
    return { ...respuesta, esNuevo };
  }

  private async verificarTokenGoogle(idToken: string) {
    if (!process.env.GOOGLE_CLIENT_ID) {
      throw new UnauthorizedException(
        'El inicio de sesión con Google no está configurado en el servidor',
      );
    }

    let ticket;
    try {
      ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
    } catch {
      throw new UnauthorizedException('Token de Google inválido o expirado');
    }

    const payload = ticket.getPayload();
    if (!payload?.email) {
      throw new UnauthorizedException(
        'No se pudo obtener el email de la cuenta de Google',
      );
    }
    if (!payload.email_verified) {
      throw new UnauthorizedException(
        'El email de tu cuenta de Google no está verificado',
      );
    }

    return payload;
  }

  private async registrarUsuarioDesdeGoogle(payloadGoogle: {
    email: string;
    given_name?: string;
    family_name?: string;
    name?: string;
    picture?: string;
    sub: string;
  }): Promise<Usuario> {
    // Google no entrega CI, celular ni dirección: se crea el cliente con
    // datos mínimos (placeholder) y se le pide completar su perfil real
    // desde /usuarios/perfil una vez dentro (ver campo "esNuevo" en la respuesta).
    const cedulaPlaceholder = `G${payloadGoogle.sub.slice(-8)}`;

    const cliente = await this.clientesService.create({
      cedulaIdentidad: cedulaPlaceholder,
      nombre: payloadGoogle.given_name || payloadGoogle.name || 'Cliente',
      apellidoPaterno: payloadGoogle.family_name || '-',
      apellidoMaterno: '-',
      celular: '00000000',
      email: payloadGoogle.email,
      direccion: 'Pendiente de registro',
    });

    const nuevoUsuario = await this.usuarioService.create({
      idCliente: cliente.id,
      email: payloadGoogle.email,
      rol: 'CLIENTE',
      imagenUrl: payloadGoogle.picture,
    });

    // Se vuelve a consultar para traer las relaciones (cliente) completas,
    // igual que hace el login normal.
    return this.usuarioService.findOne(nuevoUsuario.id);
  }

  private async construirRespuestaLogin(
    usuario: Usuario,
    debeCambiarClave: boolean,
  ) {
    let nombre = '';
    let apellidos = '';

    if (usuario.empleado) {
      nombre = usuario.empleado.nombre || '';
      apellidos =
        `${usuario.empleado.apellidoPaterno || ''} ${usuario.empleado.apellidoMaterno || ''}`.trim();
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

    const usuarioSafe = {
      id: usuario.id,
      idEmpleado: usuario.idEmpleado,
      idCliente: usuario.idCliente,
      email: usuario.email,
      rol: usuario.rol,
    };

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
