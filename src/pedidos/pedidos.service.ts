import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { UpdatePedidoDto } from './dto/update-pedido.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Pedido } from './entities/pedido.entity';
import { DataSource, Repository } from 'typeorm';
import { MailService } from 'src/mail/mail.service';
import { Producto } from 'src/productos/entities/producto.entity';
import { DetallePedido } from 'src/detalle-pedidos/entities/detalle-pedido.entity';
import { Pago } from 'src/pagos/entities/pago.entity';
import { Cliente } from 'src/clientes/entities/cliente.entity';
import { Usuario } from 'src/usuarios/entities/usuario.entity';
import { RegistrarVentaEmpleadoDto } from './dto/registrar-venta-empleado.dto';

@Injectable()
export class PedidosService {
  constructor(
    @InjectRepository(Pedido)
    private readonly pedidosRepository: Repository<Pedido>,
    private readonly mailService: MailService,
    private readonly dataSource: DataSource,
  ) {}

  async registrarVentaEmpleado(
    idUsuario: number,
    dto: RegistrarVentaEmpleadoDto,
  ): Promise<Pedido & { idCliente: number | null }> {
    const envioInmediato =
      dto.modo === 'domicilio' && dto.modalidadEntrega === 'inmediato';
    const requiereFechaEntrega =
      dto.modo === 'reserva' || (dto.modo === 'domicilio' && !envioInmediato);
    const pedidoListoSinCocina = dto.modo === 'mostrador' || envioInmediato;

    if (
      dto.modo !== 'mostrador' &&
      (!dto.cliente || (requiereFechaEntrega && !dto.fechaEntrega))
    ) {
      throw new BadRequestException(
        'Las reservas y pedidos requieren cliente; los programados también requieren fecha',
      );
    }
    if (dto.modo === 'domicilio' && !dto.direccionEnvio?.trim()) {
      throw new BadRequestException(
        'Los pedidos a domicilio requieren dirección de entrega',
      );
    }
    if (requiereFechaEntrega) {
      const fechaMinima = new Date();
      fechaMinima.setHours(0, 0, 0, 0);
      fechaMinima.setDate(fechaMinima.getDate() + 2);
      if (new Date(dto.fechaEntrega!).getTime() < fechaMinima.getTime()) {
        throw new BadRequestException(
          'La reserva o preparación debe programarse desde pasado mañana',
        );
      }
    }
    if (
      (dto.metodoPago === 'qr' || dto.metodoPago === 'transferencia') &&
      !dto.comprobante?.trim()
    ) {
      throw new BadRequestException(
        'Este método de pago requiere un número de comprobante',
      );
    }
    if (dto.metodoPago === 'tarjeta' && !dto.maskedCard) {
      throw new BadRequestException(
        'El pago con tarjeta requiere los últimos cuatro dígitos',
      );
    }

    const cantidades = new Map<number, number>();
    for (const item of dto.items) {
      cantidades.set(
        item.idProducto,
        (cantidades.get(item.idProducto) ?? 0) + item.cantidad,
      );
    }

    return this.dataSource.transaction(async (manager) => {
      let idUsuarioPedido = idUsuario;
      let idCliente: number | null = null;

      if (dto.cliente) {
        const datosCliente = dto.cliente;
        let cliente = await manager.findOne(Cliente, {
          where: { cedulaIdentidad: datosCliente.cedulaIdentidad.trim() },
          lock: { mode: 'pessimistic_write' },
        });
        const esClienteNuevo = !cliente;
        cliente ??= manager.create(Cliente, {
          cedulaIdentidad: datosCliente.cedulaIdentidad.trim(),
          nombre: datosCliente.nombre.trim(),
          apellidoPaterno: datosCliente.apellidoPaterno.trim(),
          apellidoMaterno: datosCliente.apellidoMaterno?.trim() ?? '',
          celular: datosCliente.celular.trim(),
          email: datosCliente.email.trim(),
          direccion:
            datosCliente.direccion?.trim() ||
            (dto.modo === 'domicilio' ? '' : 'Sin dirección registrada'),
        });
        cliente.nombre = datosCliente.nombre.trim();
        cliente.apellidoPaterno = datosCliente.apellidoPaterno.trim();
        cliente.apellidoMaterno =
          datosCliente.apellidoMaterno?.trim() ?? cliente.apellidoMaterno ?? '';
        cliente.celular = datosCliente.celular.trim();
        cliente.email = datosCliente.email.trim();
        if (datosCliente.direccion?.trim()) {
          cliente.direccion = datosCliente.direccion.trim();
        } else if (esClienteNuevo && dto.modo !== 'domicilio') {
          cliente.direccion = 'Sin dirección registrada';
        }
        cliente = await manager.save(cliente);
        idCliente = cliente.id;

        let usuarioCliente = await manager.findOne(Usuario, {
          where: { idCliente: cliente.id, rol: 'CLIENTE' },
          lock: { mode: 'pessimistic_write' },
        });
        if (!usuarioCliente) {
          const usuarioPorCorreo = await manager.findOne(Usuario, {
            where: { email: cliente.email },
            lock: { mode: 'pessimistic_write' },
          });
          if (usuarioPorCorreo) {
            if (
              usuarioPorCorreo.rol !== 'CLIENTE' ||
              usuarioPorCorreo.idCliente !== cliente.id
            ) {
              throw new ConflictException(
                'El correo del cliente ya está asociado a otra cuenta',
              );
            }
            usuarioCliente = usuarioPorCorreo;
          } else {
            usuarioCliente = await manager.save(
              manager.create(Usuario, {
                idCliente: cliente.id,
                email: cliente.email,
                clave: randomBytes(32).toString('hex'),
                rol: 'CLIENTE',
                activo: true,
              }),
            );
          }
        }
        idUsuarioPedido = usuarioCliente.id;
      }

      const productos: { producto: Producto; cantidad: number }[] = [];
      for (const [idProducto, cantidad] of [...cantidades].sort(
        ([idA], [idB]) => idA - idB,
      )) {
        const producto = await manager.findOne(Producto, {
          where: { id: idProducto },
          lock: { mode: 'pessimistic_write' },
        });
        if (!producto) {
          throw new NotFoundException(`El producto ${idProducto} no existe`);
        }
        if (pedidoListoSinCocina && producto.stock < cantidad) {
          throw new BadRequestException(
            `Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stock}`,
          );
        }
        productos.push({ producto, cantidad });
      }

      const total = productos.reduce(
        (suma, item) => suma + Number(item.producto.precio) * item.cantidad,
        0,
      );
      if (total <= 0) {
        throw new BadRequestException(
          'El total de la venta debe ser mayor a cero',
        );
      }

      const pedido = manager.create(Pedido, {
        idUsuario: idUsuarioPedido,
        fechaEntrega: pedidoListoSinCocina
          ? new Date()
          : new Date(dto.fechaEntrega!),
        total,
        estado:
          dto.modo === 'mostrador'
            ? 'entregado'
            : envioInmediato
              ? 'listo'
              : 'pendiente',
        tipoEnvio: dto.modo === 'domicilio' ? dto.tipoEnvio : 'retiroTienda',
        direccionEnvio:
          dto.modo !== 'domicilio'
            ? 'Sucursal Principal — Berry Sweet'
            : dto.direccionEnvio!.trim(),
        referencia: dto.referencia?.trim() || undefined,
        latitud: dto.latitud ?? 0,
        longitud: dto.longitud ?? 0,
        metodoPago: dto.metodoPago,
      });
      const pedidoGuardado = await manager.save(pedido);

      for (const { producto, cantidad } of productos) {
        if (pedidoListoSinCocina) {
          producto.stock -= cantidad;
          await manager.save(producto);
        }
        await manager.save(
          manager.create(DetallePedido, {
            idPedido: pedidoGuardado.id,
            idProducto: producto.id,
            cantidad,
            precioUnitario: Number(producto.precio),
          }),
        );
      }

      await manager.save(
        manager.create(Pago, {
          idPedido: pedidoGuardado.id,
          metodo: dto.metodoPago,
          monto: total,
          estado: dto.modo === 'mostrador' ? 'aprobado' : 'pendiente',
          comprobante: dto.comprobante?.trim() || null,
          maskedCard:
            dto.metodoPago === 'tarjeta'
              ? `****${dto.maskedCard!.slice(-4)}`
              : null,
        }),
      );

      return Object.assign(pedidoGuardado, { idCliente });
    });
  }

  async create(createPedidoDto: CreatePedidoDto): Promise<Pedido> {
    const pedido = new Pedido();
    Object.assign(pedido, createPedidoDto);

    const nuevoPedido = await this.pedidosRepository.save(pedido);

    // 👇 NUEVO: enviar correo de confirmación al cliente
    /* await this.enviarCorreoConfirmacion(nuevoPedido.id); */
    // después: el pedido se crea igual, y si el correo falla solo se registra el warning
    try {
      await this.enviarCorreoConfirmacion(nuevoPedido.id);
    } catch (err) {
      // usa tu logger si tienes; lo mantengo simple para no tocar más
      console.warn(
        '[mail] no se pudo enviar confirmación:',
        err instanceof Error ? err.message : err,
      );
    }

    return nuevoPedido;
  }

  async findAll(): Promise<Pedido[]> {
    const pedidos = await this.pedidosRepository.find({
      relations: {
        usuario: { cliente: true },
        detallePedido: { producto: true },
        pagos: true,
      },
      order: { id: 'ASC' },
    });

    return pedidos.map((pedido) => {
      // Asegurar que los arrays existan
      if (!pedido.detallePedido) pedido.detallePedido = [];
      if (!pedido.pagos) pedido.pagos = [];

      const total = (pedido.detallePedido || []).reduce(
        (sum, detalle) => sum + detalle.cantidad * detalle.precioUnitario,
        0,
      );
      const metodoPago = pedido.pagos?.[0]?.metodo ?? 'No especificado';
      return {
        ...pedido,
        total,
        metodoPago,
      } as any;
    });
  }

  async findOne(id: number): Promise<Pedido> {
    const pedido = await this.pedidosRepository.findOne({
      where: { id },
      relations: {
        usuario: { cliente: true },
        // trae los detalles + el producto (nombre, imagen, precio, etc.)
        detallePedido: { producto: true },
        // trae los pagos asociados (metodo, estado, comprobante, maskedCard…)
        pagos: true,
      },
      order: {
        detallePedido: { id: 'ASC' },
      },
    });

    if (!pedido) throw new NotFoundException('El pedido no existe');

    // Asegurar que detallePedido siempre sea un array
    if (!pedido.detallePedido) {
      pedido.detallePedido = [];
    }

    // Asegurar que pagos siempre sea un array
    if (!pedido.pagos) {
      pedido.pagos = [];
    }

    // Calcular total desde detalles del pedido
    const total = (pedido.detallePedido || []).reduce(
      (sum, detalle) => sum + detalle.cantidad * detalle.precioUnitario,
      0,
    );

    // Obtener método de pago del primer pago (si existe)
    const metodoPago = pedido.pagos?.[0]?.metodo ?? 'No especificado';

    // Retornar pedido con total y metodoPago calculados
    return {
      ...pedido,
      total,
      metodoPago,
    } as any;
  }

  async update(id: number, updatePedidoDto: UpdatePedidoDto): Promise<Pedido> {
    const pedido = await this.findOne(id);
    Object.assign(pedido, updatePedidoDto);

    if (updatePedidoDto.idUsuario) {
      pedido.idUsuario = updatePedidoDto.idUsuario;
    }

    return this.pedidosRepository.save(pedido);
  }

  async remove(id: number): Promise<Pedido> {
    const pedido = await this.findOne(id);
    return this.pedidosRepository.softRemove(pedido);
  }

  // 🔹 Enviar correo de confirmación de pedido
  private async enviarCorreoConfirmacion(id: number): Promise<void> {
    const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env;
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
      console.warn('[mail] SMTP no configurado; se omite envío');
      return;
    }
    const pedido = await this.pedidosRepository.findOne({
      where: { id },
      relations: {
        usuario: { cliente: true },
        detallePedido: { producto: true },
        pagos: true,
      },
    });

    if (!pedido) throw new NotFoundException('El pedido no existe');

    // Calcular total desde detalles del pedido
    const total = pedido.detallePedido.reduce(
      (sum, detalle) => sum + detalle.cantidad * detalle.precioUnitario,
      0,
    );

    // Obtener método de pago del primer pago (si existe)
    const metodoPago = pedido.pagos?.[0]?.metodo ?? 'No especificado';

    // Aquí llamas al servicio de correo con todos los datos del pedido
    await this.mailService.enviarConfirmacionPedido({
      para: pedido.usuario.email,
      pedido: {
        id: pedido.id,
        total,
        metodoPago,
        direccion: pedido.direccionEnvio ?? '',
        estado: pedido.estado,
      },
      usuario: {
        nombre: pedido.usuario.cliente.nombre,
      },
    });
  }

  async findByUser(idUsuario: number): Promise<Pedido[]> {
    return this.pedidosRepository.find({
      where: { idUsuario },
      relations: { detallePedido: { producto: true }, pagos: true },
      order: { id: 'DESC' },
    });
  }

  async cambiarEstado(id: number, estado: string): Promise<Pedido> {
    if (estado !== 'cancelado') {
      throw new BadRequestException(
        'Los cambios de preparación y entrega deben realizarse desde cocina',
      );
    }
    const pedido = await this.findOne(id);
    pedido.estado = estado;
    return this.pedidosRepository.save(pedido); // UpdateDateColumn se actualiza solo
  }

  async findMios(idUsuario: number): Promise<Pedido[]> {
    return this.findByUser(idUsuario);
  }
}
