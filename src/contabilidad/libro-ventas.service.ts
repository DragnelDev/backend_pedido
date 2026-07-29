import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pago } from 'src/pagos/entities/pago.entity';
import { rangoDelMes } from './contabilidad.utils';

export interface FilaLibroVentas {
  id: number;
  fecha: Date;
  nroFactura: number;
  cliente: string;
  ciNit: string;
  monto: number;
  metodo: string;
}

@Injectable()
export class LibroVentasService {
  constructor(
    @InjectRepository(Pago)
    private readonly pagosRepository: Repository<Pago>,
  ) {}

  async listar(
    mes?: string,
  ): Promise<{ mes: string; total: number; filas: FilaLibroVentas[] }> {
    const { desde, hasta } = rangoDelMes(mes);

    const pagos = await this.pagosRepository
      .createQueryBuilder('pago')
      .innerJoinAndSelect('pago.pedido', 'pedido')
      .leftJoinAndSelect('pedido.usuario', 'usuario')
      .leftJoinAndSelect('usuario.cliente', 'cliente')
      .where('pago.estado = :estado', { estado: 'aprobado' })
      .andWhere('DATE(pago.fecha_pago) BETWEEN :desde AND :hasta', {
        desde,
        hasta,
      })
      .orderBy('pago.fecha_pago', 'DESC')
      .getMany();

    const filas: FilaLibroVentas[] = pagos.map((pago) => {
      const cliente = pago.pedido?.usuario?.cliente;
      const nombreCliente = cliente
        ? [cliente.nombre, cliente.apellidoPaterno].filter(Boolean).join(' ')
        : 'Cliente eventual';

      return {
        id: pago.id,
        fecha: pago.fechaPago,
        nroFactura: pago.idPedido,
        cliente: nombreCliente,
        ciNit: cliente?.cedulaIdentidad || '-',
        monto: Number(pago.monto),
        metodo: (pago.metodo || '').toUpperCase(),
      };
    });

    const total = Number(filas.reduce((acc, f) => acc + f.monto, 0).toFixed(2));

    return { mes: mes ?? desde.slice(0, 7), total, filas };
  }
}
