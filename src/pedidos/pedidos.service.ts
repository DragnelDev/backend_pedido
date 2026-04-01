import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { UpdatePedidoDto } from './dto/update-pedido.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Pedido } from './entities/pedido.entity';
import { Repository } from 'typeorm';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class PedidosService {
  constructor(
    @InjectRepository(Pedido)
    private readonly pedidosRepository: Repository<Pedido>,
    private readonly mailService: MailService,
  ) {}

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
        err?.message ?? err,
      );
    }

    return nuevoPedido;
  }

  async findAll(): Promise<Pedido[]> {
    return this.pedidosRepository.find({
      relations: { usuario: true },
      select: {
        id: true,
        estado: true,
        fechaCreacion: true,
        usuario: { id: true, idCliente: true /*email: true*/ },
      },
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Pedido> {
    const pedido = await this.pedidosRepository.findOne({
      where: { id },
      relations: {
        usuario: true,
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

    // Calcular total desde detalles del pedido
    const total = pedido.detallePedido.reduce(
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
    const permitidos = [
      'pendiente',
      'entregado',
      'enviado',
      'confirmado',
      'cancelado',
    ];
    if (!permitidos.includes(estado)) {
      throw new BadRequestException('Estado inválido');
    }
    const pedido = await this.findOne(id);
    pedido.estado = estado;
    return this.pedidosRepository.save(pedido); // UpdateDateColumn se actualiza solo
  }

  async findMios(idUsuario: number): Promise<Pedido[]> {
    return this.findByUser(idUsuario);
  }
}
