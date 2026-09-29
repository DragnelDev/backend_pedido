import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, jest } from '@jest/globals';
import {
  DataSource,
  EntityManager,
  FindManyOptions,
  Repository,
} from 'typeorm';
import { Pedido } from 'src/pedidos/entities/pedido.entity';
import { RecetaInsumo } from 'src/recetas/entities/receta-insumo.entity';
import { CocinaService } from './cocina.service';

describe('CocinaService', () => {
  it('loads payment state on the kitchen board', async () => {
    const findPedidos = jest
      .fn<(options?: FindManyOptions<Pedido>) => Promise<Pedido[]>>()
      .mockResolvedValue([]);
    const pedidosRepository = {
      find: findPedidos,
    } as unknown as Repository<Pedido>;
    const service = new CocinaService(
      pedidosRepository,
      {} as Repository<RecetaInsumo>,
      {} as DataSource,
    );

    await service.tablero();

    const opciones = findPedidos.mock.calls[0]?.[0];
    expect(opciones?.relations).toEqual({
      detallePedido: { producto: true },
      usuario: { cliente: true },
      pagos: true,
    });
  });

  it('does not advance an order without an approved payment', async () => {
    const savePedido = jest.fn();
    const pedidosRepository = {
      findOne: jest.fn<() => Promise<Pedido>>().mockResolvedValue({
        id: 7,
        estado: 'pendiente',
        pagos: [{ estado: 'en_revision' }],
        detallePedido: [],
      } as unknown as Pedido),
      save: savePedido,
    } as unknown as Repository<Pedido>;
    const recetaRepository = {} as Repository<RecetaInsumo>;
    const dataSource = {} as DataSource;
    const service = new CocinaService(
      pedidosRepository,
      recetaRepository,
      dataSource,
    );

    await expect(
      service.cambiarEstado(7, 'en_preparacion'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(savePedido).not.toHaveBeenCalled();
  });

  it('adds prepared product units when an order becomes ready', async () => {
    const pedido = {
      id: 7,
      estado: 'en_preparacion',
      pagos: [{ estado: 'aprobado' }],
      detallePedido: [{ idProducto: 5, cantidad: 3 }],
    } as unknown as Pedido;
    const producto = { id: 5, nombre: 'Torta', stock: 0 };
    const findOneEnTransaccion = jest
      .fn()
      .mockResolvedValueOnce(pedido)
      .mockResolvedValueOnce(producto);
    const manager = {
      findOne: findOneEnTransaccion,
      find: jest.fn().mockResolvedValue([]),
      save: jest.fn((entity: unknown) => entity),
    };
    const dataSource = {
      transaction: jest.fn(
        async (work: (manager: EntityManager) => Promise<unknown>) =>
          work(manager as unknown as EntityManager),
      ),
    } as unknown as DataSource;
    const pedidosRepository = {
      findOne: jest.fn().mockResolvedValue(pedido),
    } as unknown as Repository<Pedido>;
    const service = new CocinaService(
      pedidosRepository,
      {} as Repository<RecetaInsumo>,
      dataSource,
    );

    await service.cambiarEstado(7, 'listo');

    expect(producto.stock).toBe(3);
    expect(pedido.estado).toBe('listo');
  });

  it('decreases prepared product units when an order is delivered', async () => {
    const pedido = {
      id: 7,
      estado: 'listo',
      pagos: [{ estado: 'aprobado' }],
      detallePedido: [{ idProducto: 5, cantidad: 3 }],
    } as unknown as Pedido;
    const producto = { id: 5, nombre: 'Torta', stock: 3 };
    const findOneEnTransaccion = jest
      .fn()
      .mockResolvedValueOnce(pedido)
      .mockResolvedValueOnce(producto);
    const manager = {
      findOne: findOneEnTransaccion,
      save: jest.fn((entity: unknown) => entity),
    };
    const dataSource = {
      transaction: jest.fn(
        async (work: (manager: EntityManager) => Promise<unknown>) =>
          work(manager as unknown as EntityManager),
      ),
    } as unknown as DataSource;
    const pedidosRepository = {
      findOne: jest.fn().mockResolvedValue(pedido),
    } as unknown as Repository<Pedido>;
    const service = new CocinaService(
      pedidosRepository,
      {} as Repository<RecetaInsumo>,
      dataSource,
    );

    await service.cambiarEstado(7, 'entregado');

    expect(producto.stock).toBe(0);
    expect(pedido.estado).toBe('entregado');
  });
});
