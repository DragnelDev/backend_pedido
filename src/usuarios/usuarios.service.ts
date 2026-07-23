import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from './entities/usuario.entity';
import { Empleado } from 'src/empleados/entities/empleado.entity';
import { Cliente } from 'src/clientes/entities/cliente.entity';
import { CambiarClaveDto } from './dto/cambiar-clave.dto';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuariosRepository: Repository<Usuario>,

    @InjectRepository(Empleado)
    private readonly empleadosRepository: Repository<Empleado>,

    @InjectRepository(Cliente)
    private readonly clientesRepository: Repository<Cliente>,
  ) {}

  async create(createUsuarioDto: CreateUsuarioDto): Promise<Usuario> {
    // 1. Validar que al menos uno de los IDs sea proporcionado
    if (!createUsuarioDto.idEmpleado && !createUsuarioDto.idCliente) {
      throw new BadRequestException(
        'Debe proporcionar al menos un idEmpleado o un idCliente',
      );
    }

    // 2. Validar si el usuario ya existe por email
    let usuario = await this.usuariosRepository.findOneBy({
      email: createUsuarioDto.email.trim(),
    });
    if (usuario) throw new ConflictException('El usuario ya existe');

    // 3. Obtener la cédula de identidad según el caso
    let cedula = '';

    if (createUsuarioDto.idEmpleado) {
      // Busca el empleado en su repositorio/servicio
      const empleado = await this.empleadosRepository.findOneBy({
        id: createUsuarioDto.idEmpleado,
      });
      if (!empleado) throw new NotFoundException('Empleado no encontrado');
      cedula = empleado.cedulaIdentidad;
    } else if (createUsuarioDto.idCliente) {
      // Busca el cliente en su repositorio/servicio
      const cliente = await this.clientesRepository.findOneBy({
        id: createUsuarioDto.idCliente,
      });
      if (!cliente) throw new NotFoundException('Cliente no encontrado');
      cedula = cliente.cedulaIdentidad;
    }

    // 4. Construir la contraseña por defecto (.env + cedula)
    const basePassword = process.env.DEFAULT_PASSWORD ?? '';
    const passwordFinal = `${basePassword}${cedula}`;

    // 5. Crear y guardar el usuario
    usuario = new Usuario();
    Object.assign(usuario, createUsuarioDto);

    // Asignamos la clave generada (¡Recuerda hashearla después si usas bcrypt!)
    usuario.clave = passwordFinal;

    return this.usuariosRepository.save(usuario);
  }

  async findAll(): Promise<Usuario[]> {
    return this.usuariosRepository.find({
      relations: { cliente: true, empleado: true },
      select: {
        id: true,
        imagenUrl: true,
        email: true,
        idEmpleado: true,
        idCliente: true,
        rol: true,
        activo: true,
        fechaCambioClave: true,
        fechaCreacion: true,
        cliente: { id: true, nombre: true },
        empleado: { id: true, nombre: true },
      },
    });
  }

  async findOne(id: number): Promise<Usuario> {
    const usuario = await this.usuariosRepository.findOne({
      where: { id },
      relations: { cliente: true, empleado: true },
      select: {
        id: true,
        imagenUrl: true,
        email: true,
        idEmpleado: true,
        idCliente: true,
        rol: true,
        activo: true,
        fechaCambioClave: true,
        fechaCreacion: true,
        cliente: {
          id: true,
          nombre: true,
          apellidoPaterno: true,
          apellidoMaterno: true,
          celular: true,
          direccion: true,
        },
        empleado: {
          id: true,
          cedulaIdentidad: true,
          nombre: true,
          apellidoPaterno: true,
          apellidoMaterno: true,
          fechaNacimiento: true,
          direccion: true,
          celular: true,
          email: true,
          fechaIngreso: true,
          cargo: true,
          salario: true,
          activo: true,
        },
      },
    });
    if (!usuario) throw new NotFoundException('El usuario no existe');
    return usuario;
  }

  async update(
    id: number,
    updateUsuarioDto: UpdateUsuarioDto,
  ): Promise<Usuario> {
    const usuario = await this.findOne(id);

    // Separar los datos del cliente si existen
    const { cliente, ...usuarioData } = updateUsuarioDto as any;

    // Actualizar datos del usuario
    Object.assign(usuario, usuarioData);

    // Asegurar que existe cliente antes de guardar los datos anidados
    if (cliente) {
      let clienteEntity: Cliente | null = usuario.cliente;

      if (!clienteEntity && usuario.idCliente) {
        clienteEntity = await this.clientesRepository.findOneBy({
          id: usuario.idCliente,
        });
      }

      if (clienteEntity) {
        Object.assign(clienteEntity, cliente);
        await this.clientesRepository.save(clienteEntity);
      }
    }

    return this.usuariosRepository.save(usuario);
  }

  async remove(id: number): Promise<Usuario> {
    const usuario = await this.findOne(id);
    return this.usuariosRepository.softRemove(usuario);
  }

  async validate(
    email: string,
    clave: string,
  ): Promise<{ usuario: Usuario; debeCambiarClave: boolean }> {
    const usuarioOk = await this.usuariosRepository.findOne({
      where: { email },
      relations: { cliente: true, empleado: true },
      select: {
        id: true,
        idEmpleado: true,
        idCliente: true,
        email: true,
        clave: true,
        rol: true,
        fechaCambioClave: true,
        imagenUrl: true,
        cliente: { id: true, nombre: true },
        empleado: {
          id: true,
          nombre: true,
          apellidoPaterno: true,
          apellidoMaterno: true,
        },
      },
    });

    if (!usuarioOk) throw new NotFoundException('Usuario inexistente');

    if (!(await usuarioOk?.validatePassword(clave))) {
      throw new UnauthorizedException('Clave incorrecta');
    }

    // Si fechaCambioClave es null, significa que es su primer inicio de sesión
    const debeCambiarClave = usuarioOk.fechaCambioClave === null;

    return {
      usuario: usuarioOk,
      debeCambiarClave,
    };
  }

  // 3. NUEVO MÉTODO: Lógica para actualizar la contraseña por primera vez o restablecimiento
  async cambiarClave(
    id: number,
    cambiarClaveDto: CambiarClaveDto,
  ): Promise<{ message: string }> {
    // Buscamos al usuario incluyendo su clave actual
    const usuario = await this.usuariosRepository.findOne({
      where: { id },
      select: ['id', 'clave', 'fechaCambioClave'],
    });

    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    // Validar que la contraseña actual sea correcta
    const esClaveValida = await usuario.validatePassword(
      cambiarClaveDto.claveActual,
    );
    if (!esClaveValida) {
      throw new UnauthorizedException('La contraseña actual es incorrecta');
    }

    // Validar que la clave nueva no sea igual a la contraseña temporal
    const esIgualAlaAnterior = await usuario.validatePassword(
      cambiarClaveDto.nuevaClave,
    );
    if (esIgualAlaAnterior) {
      throw new BadRequestException(
        'La nueva contraseña no puede ser igual a la anterior',
      );
    }

    // Asignamos la nueva clave (el hook @BeforeUpdate la hasheará)
    usuario.clave = cambiarClaveDto.nuevaClave;

    // Guardamos el momento exacto del cambio
    usuario.fechaCambioClave = new Date();

    try {
      const usuarioActualizado = await this.usuariosRepository.save(usuario);
      return { message: 'Contraseña actualizada con éxito' };
    } catch (error) {
      console.error('Error al guardar la contraseña:', error);
      throw new BadRequestException(
        'Error al actualizar la contraseña. Intenta de nuevo.',
      );
    }
  }
}
