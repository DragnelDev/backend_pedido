import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DetallePedido } from './entities/detalle-pedido.entity';
import { Repository } from 'typeorm';
import { CreateDetallePedidoDto } from './dto/create-detalle-pedido.dto';
import { UpdateDetallePedidoDto } from './dto/update-detalle-pedido.dto';

@Injectable()
export class DetallePedidosService {
  constructor(
    @InjectRepository(DetallePedido)
    private detallePedidoRepository: Repository<DetallePedido>,
  ) {}

  async create(
    createDetallePedidoDto: CreateDetallePedidoDto,
  ): Promise<DetallePedido> {
    const pedidoProducto = new DetallePedido();
    Object.assign(pedidoProducto, createDetallePedidoDto);

    return this.detallePedidoRepository.save(pedidoProducto);
  }

  async findAll(): Promise<DetallePedido[]> {
    return this.detallePedidoRepository.find({
      relations: { pedido: true, producto: true },
      select: {
        id: true,
        idPedido: true,
        idProducto: true,
        cantidad: true,
        precioUnitario: true,
        pedido: { id: true },
        producto: { id: true, nombre: true, precio: true, imagenUrl: true },
      },
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<DetallePedido> {
    const pedidoProducto = await this.detallePedidoRepository.findOne({
      where: { id },
      relations: { pedido: true, producto: true },
    });
    if (!pedidoProducto)
      throw new NotFoundException('El detalle del pedido no existe');
    return pedidoProducto;
  }

  async update(
    id: number,
    updateDetallePedidoDto: UpdateDetallePedidoDto,
  ): Promise<DetallePedido> {
    const pedidoProducto = await this.findOne(id);
    Object.assign(pedidoProducto, updateDetallePedidoDto);
    return this.detallePedidoRepository.save(pedidoProducto);
  }

  async remove(id: number): Promise<DetallePedido> {
    const pedidoProducto = await this.findOne(id);
    return this.detallePedidoRepository.softRemove(pedidoProducto);
  }
}
