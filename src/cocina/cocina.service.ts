import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { Pedido } from 'src/pedidos/entities/pedido.entity';
import { Producto } from 'src/productos/entities/producto.entity';
import { RecetaInsumo } from 'src/recetas/entities/receta-insumo.entity';
import { Insumo } from 'src/insumos/entities/insumo.entity';
import { EstadoCocina } from './dto/cambiar-estado-cocina.dto';

// Se excluyen pedidos entregados/cancelados; los pagos no aprobados siguen
// visibles en cocina para explicar el bloqueo y esperar su aprobación.
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
        pagos: true,
      },
      order: { fechaEntrega: 'ASC' },
    });
  }

  async cambiarEstado(
    idPedido: number,
    nuevoEstado: EstadoCocina,
  ): Promise<Pedido> {
    if (nuevoEstado === 'listo' || nuevoEstado === 'entregado') {
      await this.actualizarStockDelPedido(idPedido, nuevoEstado);
    } else {
      const pedido = await this.pedidosRepository.findOne({
        where: { id: idPedido },
        relations: { detallePedido: true, pagos: true },
      });
      if (!pedido) throw new NotFoundException('El pedido no existe');

      this.validarTransicion(pedido, nuevoEstado);
      pedido.estado = nuevoEstado;
      await this.pedidosRepository.save(pedido);
    }

    const actualizado = await this.pedidosRepository.findOne({
      where: { id: idPedido },
      relations: {
        detallePedido: { producto: true },
        usuario: { cliente: true },
      },
    });
    if (!actualizado) throw new NotFoundException('El pedido no existe');
    return actualizado;
  }

  private validarTransicion(pedido: Pedido, nuevoEstado: EstadoCocina): void {
    const permitidas = TRANSICIONES[pedido.estado] ?? [];
    if (!permitidas.includes(nuevoEstado)) {
      throw new BadRequestException(
        `No se puede pasar de "${pedido.estado}" a "${nuevoEstado}"`,
      );
    }
    if (pedido.pagos?.[0]?.estado !== 'aprobado') {
      throw new BadRequestException(
        'El pago debe estar aprobado antes de avanzar el estado del pedido',
      );
    }
  }

  private async actualizarStockDelPedido(
    idPedido: number,
    nuevoEstado: 'listo' | 'entregado',
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const pedido = await manager.findOne(Pedido, {
        where: { id: idPedido },
        relations: { detallePedido: true, pagos: true },
        lock: { mode: 'pessimistic_write', tables: ['pedidos'] },
      });
      if (!pedido) throw new NotFoundException('El pedido no existe');

      this.validarTransicion(pedido, nuevoEstado);

      const cantidades = new Map<number, number>();
      for (const detalle of pedido.detallePedido) {
        cantidades.set(
          detalle.idProducto,
          (cantidades.get(detalle.idProducto) ?? 0) + detalle.cantidad,
        );
      }

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

        const stock = Number(producto.stock ?? 0);
        if (nuevoEstado === 'entregado' && stock < cantidad) {
          throw new BadRequestException(
            `Stock insuficiente para entregar ${producto.nombre}. Disponible: ${stock}`,
          );
        }
        producto.stock =
          stock + (nuevoEstado === 'listo' ? cantidad : -cantidad);
        await manager.save(producto);
      }

      if (nuevoEstado === 'listo') {
        await this.descontarInsumosDelPedido(pedido, manager);
      }

      pedido.estado = nuevoEstado;
      await manager.save(pedido);
    });
  }

  private async descontarInsumosDelPedido(
    pedido: Pedido,
    manager: EntityManager,
  ): Promise<void> {
    const idsProductos = [
      ...new Set(pedido.detallePedido.map((d) => d.idProducto)),
    ];
    if (idsProductos.length === 0) return;

    const recetas = await manager.find(RecetaInsumo, {
      where: { idProducto: In(idsProductos) },
    });
    if (recetas.length === 0) return; // Productos sin receta configurada: no hay nada que descontar

    // Consumo total requerido por insumo = suma de (cantidad del detalle × cantidad por unidad de receta)
    const consumoPorInsumo = new Map<number, number>();
    for (const detalle of pedido.detallePedido) {
      const recetasDelProducto = recetas.filter(
        (r) => r.idProducto === detalle.idProducto,
      );
      for (const receta of recetasDelProducto) {
        const consumo = Number(receta.cantidadPorUnidad) * detalle.cantidad;
        consumoPorInsumo.set(
          receta.idInsumo,
          (consumoPorInsumo.get(receta.idInsumo) ?? 0) + consumo,
        );
      }
    }

    for (const [idInsumo, consumo] of consumoPorInsumo) {
      const insumo = await manager.findOne(Insumo, {
        where: { id: idInsumo },
        lock: { mode: 'pessimistic_write' },
      });
      if (!insumo) continue; // Insumo eliminado desde que se configuró la receta: se ignora

      insumo.stock = Number(insumo.stock) - consumo;
      await manager.save(insumo);
    }
  }
}
