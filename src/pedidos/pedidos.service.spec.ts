import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, jest } from '@jest/globals';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Cliente } from 'src/clientes/entities/cliente.entity';
import { DetallePedido } from 'src/detalle-pedidos/entities/detalle-pedido.entity';
import { MailService } from 'src/mail/mail.service';
import { Pago } from 'src/pagos/entities/pago.entity';
import { Producto } from 'src/productos/entities/producto.entity';
import { Usuario } from 'src/usuarios/entities/usuario.entity';
import { RegistrarVentaEmpleadoDto } from './dto/registrar-venta-empleado.dto';
import { Pedido } from './entities/pedido.entity';
import { PedidosService } from './pedidos.service';

describe('PedidosService', () => {
  function crearServicio(
    stock: number,
    opciones: { clienteExiste?: boolean; usuarioClienteExiste?: boolean } = {},
  ) {
    const { clienteExiste = true, usuarioClienteExiste = true } = opciones;
    const producto = { id: 5, nombre: 'Torta', precio: 25, stock } as Producto;
    const cliente = {
      id: 22,
      cedulaIdentidad: '12345678',
      nombre: 'Ana',
      apellidoPaterno: 'Pérez',
      apellidoMaterno: '',
      celular: '70000000',
      email: 'ana@example.com',
      direccion: 'Sin dirección registrada',
    } as Cliente;
    const usuarioCliente = { id: 42, idCliente: 22, rol: 'CLIENTE' } as Usuario;
    const crearEntidad = jest.fn(
      (entity: new () => object, values: Record<string, unknown>) =>
        Object.assign(new entity(), values),
    );
    const guardarEntidad = jest.fn((entity: object) => {
      if (entity instanceof Pedido) Object.assign(entity, { id: 31 });
      if (entity instanceof Cliente) Object.assign(entity, { id: 22 });
      if (entity instanceof Usuario) Object.assign(entity, { id: 42 });
      return entity;
    });
    const buscarProducto = jest.fn(
      (entity: unknown): Producto | Cliente | Usuario | null => {
        if (entity === Producto) return producto;
        if (entity === Cliente) return clienteExiste ? cliente : null;
        if (entity === Usuario) {
          return usuarioClienteExiste ? usuarioCliente : null;
        }
        return null;
      },
    );
    const manager = {
      create: crearEntidad,
      findOne: buscarProducto,
      save: guardarEntidad,
    } as unknown as EntityManager;
    const dataSource = {
      transaction: async <T>(
        callback: (manager: EntityManager) => Promise<T>,
      ) => callback(manager),
    } as DataSource;
    const repository = {} as Repository<Pedido>;
    const service = new PedidosService(
      repository,
      {} as MailService,
      dataSource,
    );

    return {
      service,
      producto,
      cliente,
      usuarioCliente,
      crearEntidad,
      guardarEntidad,
      buscarProducto,
    };
  }

  const venta: RegistrarVentaEmpleadoDto = {
    modo: 'mostrador',
    metodoPago: 'efectivo',
    tipoEnvio: 'retiroTienda',
    items: [{ idProducto: 5, cantidad: 2 }],
  };

  it('stores the counter sale, payment and stock deduction in one transaction', async () => {
    const { service, producto, crearEntidad, guardarEntidad } =
      crearServicio(4);

    const pedido = await service.registrarVentaEmpleado(9, venta);

    expect(pedido.id).toBe(31);
    expect(producto.stock).toBe(2);
    expect(crearEntidad).toHaveBeenCalledWith(
      Pedido,
      expect.objectContaining({ total: 50, estado: 'entregado' }),
    );
    expect(crearEntidad).toHaveBeenCalledWith(
      DetallePedido,
      expect.objectContaining({ cantidad: 2, precioUnitario: 25 }),
    );
    expect(crearEntidad).toHaveBeenCalledWith(
      Pago,
      expect.objectContaining({ estado: 'aprobado', monto: 50 }),
    );
    expect(guardarEntidad).toHaveBeenCalledTimes(4);
  });

  it('rejects insufficient stock before writing a sale', async () => {
    const { service, guardarEntidad } = crearServicio(1);

    await expect(
      service.registrarVentaEmpleado(9, venta),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(guardarEntidad).not.toHaveBeenCalled();
  });

  it('rejects immediate delivery when there is not enough ready stock', async () => {
    const { service, producto, crearEntidad } = crearServicio(1);
    const envioInmediato: RegistrarVentaEmpleadoDto = {
      ...venta,
      modo: 'domicilio',
      modalidadEntrega: 'inmediato',
      tipoEnvio: 'delivery',
      direccionEnvio: 'Calle Principal 123',
      cliente: {
        cedulaIdentidad: '12345678',
        nombre: 'Ana',
        apellidoPaterno: 'Pérez',
        celular: '70000000',
        email: 'ana@example.com',
      },
    };

    await expect(
      service.registrarVentaEmpleado(9, envioInmediato),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(producto.stock).toBe(1);
    expect(crearEntidad).not.toHaveBeenCalledWith(Pedido, expect.anything());
  });

  it('keeps a delivery order pending without consuming stock before payment', async () => {
    const { service, producto, crearEntidad, cliente } = crearServicio(4);
    const pedidoDomicilio: RegistrarVentaEmpleadoDto = {
      ...venta,
      modo: 'domicilio',
      tipoEnvio: 'delivery',
      modalidadEntrega: 'programado',
      fechaEntrega: new Date(
        Date.now() + 3 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      direccionEnvio: 'Calle Principal 123',
      cliente,
    };

    await service.registrarVentaEmpleado(9, pedidoDomicilio);

    expect(producto.stock).toBe(4);
    expect(crearEntidad).toHaveBeenCalledWith(
      Pedido,
      expect.objectContaining({
        idUsuario: 42,
        estado: 'pendiente',
      }),
    );
    expect(crearEntidad).toHaveBeenCalledWith(
      Pago,
      expect.objectContaining({ estado: 'pendiente' }),
    );
  });

  it('allows scheduled preparation without ready-to-dispatch stock', async () => {
    const { service, producto, crearEntidad } = crearServicio(0);
    const pedidoDomicilio: RegistrarVentaEmpleadoDto = {
      ...venta,
      modo: 'domicilio',
      modalidadEntrega: 'programado',
      tipoEnvio: 'delivery',
      fechaEntrega: new Date(
        Date.now() + 3 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      direccionEnvio: 'Calle Principal 123',
      cliente: {
        cedulaIdentidad: '12345678',
        nombre: 'Ana',
        apellidoPaterno: 'Pérez',
        celular: '70000000',
        email: 'ana@example.com',
      },
    };

    const pedido = await service.registrarVentaEmpleado(9, pedidoDomicilio);

    expect(pedido.estado).toBe('pendiente');
    expect(producto.stock).toBe(0);
    expect(crearEntidad).toHaveBeenCalledWith(
      Pedido,
      expect.objectContaining({ estado: 'pendiente' }),
    );
  });

  it('rejects reservations scheduled before the minimum two-day window', async () => {
    const { service, guardarEntidad } = crearServicio(4);
    const reserva: RegistrarVentaEmpleadoDto = {
      ...venta,
      modo: 'reserva',
      fechaEntrega: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      cliente: {
        cedulaIdentidad: '12345678',
        nombre: 'Ana',
        apellidoPaterno: 'Pérez',
        celular: '70000000',
        email: 'ana@example.com',
      },
    };

    await expect(
      service.registrarVentaEmpleado(9, reserva),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(guardarEntidad).not.toHaveBeenCalled();
  });

  it('marks ready-to-dispatch delivery as listo without scheduling kitchen prep', async () => {
    const { service, producto, crearEntidad } = crearServicio(4);
    const envioInmediato: RegistrarVentaEmpleadoDto = {
      ...venta,
      modo: 'domicilio',
      modalidadEntrega: 'inmediato',
      tipoEnvio: 'delivery',
      direccionEnvio: 'Calle Principal 123',
      cliente: {
        cedulaIdentidad: '12345678',
        nombre: 'Ana',
        apellidoPaterno: 'Pérez',
        celular: '70000000',
        email: 'ana@example.com',
      },
    };

    const pedido = await service.registrarVentaEmpleado(9, envioInmediato);

    expect(pedido.estado).toBe('listo');
    expect(producto.stock).toBe(2);
    expect(crearEntidad).toHaveBeenCalledWith(
      Pedido,
      expect.objectContaining({ estado: 'listo', tipoEnvio: 'delivery' }),
    );
  });

  it('links a local reservation to the client instead of the employee', async () => {
    const { service, crearEntidad, usuarioCliente } = crearServicio(4);
    const reserva: RegistrarVentaEmpleadoDto = {
      ...venta,
      modo: 'reserva',
      fechaEntrega: new Date(
        Date.now() + 3 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      cliente: {
        cedulaIdentidad: '12345678',
        nombre: 'Ana',
        apellidoPaterno: 'Pérez',
        apellidoMaterno: '',
        celular: '70000000',
        email: 'ana@example.com',
      },
    };

    const pedido = await service.registrarVentaEmpleado(9, reserva);

    expect(pedido.idUsuario).toBe(usuarioCliente.id);
    expect(pedido.idCliente).toBe(usuarioCliente.idCliente);
    expect(crearEntidad).toHaveBeenCalledWith(
      Pedido,
      expect.objectContaining({
        idUsuario: usuarioCliente.id,
        estado: 'pendiente',
        tipoEnvio: 'retiroTienda',
      }),
    );
  });

  it('creates a client account when registering a customer without one', async () => {
    const { service, crearEntidad, usuarioCliente } = crearServicio(4, {
      clienteExiste: false,
      usuarioClienteExiste: false,
    });
    const reserva: RegistrarVentaEmpleadoDto = {
      ...venta,
      modo: 'reserva',
      fechaEntrega: new Date(
        Date.now() + 3 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      cliente: {
        cedulaIdentidad: '12345678',
        nombre: 'Ana',
        apellidoPaterno: 'Pérez',
        celular: '70000000',
        email: 'ana@example.com',
      },
    };

    const pedido = await service.registrarVentaEmpleado(9, reserva);

    expect(pedido.idUsuario).toBe(usuarioCliente.id);
    expect(crearEntidad).toHaveBeenCalledWith(
      Cliente,
      expect.objectContaining({ cedulaIdentidad: '12345678' }),
    );
    expect(crearEntidad).toHaveBeenCalledWith(
      Usuario,
      expect.objectContaining({ idCliente: 22, rol: 'CLIENTE' }),
    );
  });
});
