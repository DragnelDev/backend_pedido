import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Pedido } from 'src/pedidos/entities/pedido.entity';
import { RecetaInsumo } from 'src/recetas/entities/receta-insumo.entity';
import { Insumo } from 'src/insumos/entities/insumo.entity';
import { EstadoCocina } from './dto/cambiar-estado-cocina.dto';

// Estados relevantes para el tablero de cocina (se ignoran pedidos ya
// entregados/cancelados o los que aún no fueron confirmados/pagados).
const ESTADOS_TABLERO = ['pendiente', 'en_preparacion', 'listo'];

// Transiciones permitidas desde cada estado
const TRANSICIONES: Record<string, EstadoCocina[]> = {
  pendiente: ['en_preparacion'],
  en_preparacion: ['listo'],
  listo: ['entregado'],
  entregado: [],
};

@Injectable()
export class CocinaService {
  constructor(
    @InjectRepository(Pedido)
    private readonly pedidosRepository: Repository<Pedido>,

    @InjectRepository(RecetaInsumo)
    private readonly recetaRepository: Repository<RecetaInsumo>,

    private readonly dataSource: DataSource,
  ) {}

  async tablero(): Promise<Pedido[]> {
    return this.pedidosRepository.find({
      where: { estado: In(ESTADOS_TABLERO) },
      relations: {
        detallePedido: { producto: true },
        usuario: { cliente: true },
      },
      order: { fechaEntrega: 'ASC' },
    });
  }

  async cambiarEstado(idPedido: number, nuevoEstado: EstadoCocina): Promise<Pedido> {
    const pedido = await this.pedidosRepository.findOne({
      where: { id: idPedido },
      relations: { detallePedido: true },
    });
    if (!pedido) throw new NotFoundException('El pedido no existe');

    const permitidas = TRANSICIONES[pedido.estado] ?? [];
    if (!permitidas.includes(nuevoEstado)) {
      throw new BadRequestException(
        `No se puede pasar de "${pedido.estado}" a "${nuevoEstado}"`,
      );
    }

    // Al marcar el pedido como LISTO se descuenta automáticamente el
    // stock de insumos según la receta de cada producto del pedido.
    if (nuevoEstado === 'listo') {
      await this.descontarInsumosDelPedido(pedido);
    }

    pedido.estado = nuevoEstado;
    return this.pedidosRepository.save(pedido);
  }

  private async descontarInsumosDelPedido(pedido: Pedido): Promise<void> {
    const idsProductos = [...new Set(pedido.detallePedido.map((d) => d.idProducto))];
    if (idsProductos.length === 0) return;

    const recetas = await this.recetaRepository.find({
      where: { idProducto: In(idsProductos) },
    });
    if (recetas.length === 0) return; // Productos sin receta configurada: no hay nada que descontar

    // Consumo total requerido por insumo = suma de (cantidad del detalle × cantidad por unidad de receta)
    const consumoPorInsumo = new Map<number, number>();
    for (const detalle of pedido.detallePedido) {
      const recetasDelProducto = recetas.filter((r) => r.idProducto === detalle.idProducto);
      for (const receta of recetasDelProducto) {
        const consumo = Number(receta.cantidadPorUnidad) * detalle.cantidad;
        consumoPorInsumo.set(
          receta.idInsumo,
          (consumoPorInsumo.get(receta.idInsumo) ?? 0) + consumo,
        );
      }
    }

    await this.dataSource.transaction(async (manager) => {
      for (const [idInsumo, consumo] of consumoPorInsumo) {
        const insumo = await manager.findOneBy(Insumo, { id: idInsumo });
        if (!insumo) continue; // Insumo eliminado desde que se configuró la receta: se ignora

        insumo.stock = Number(insumo.stock) - consumo;
        await manager.save(insumo);
      }
    });
  }
}
