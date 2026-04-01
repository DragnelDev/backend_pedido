import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCarritoDetalleDto } from './dto/create-carrito-detalle.dto';
import { UpdateCarritoDetalleDto } from './dto/update-carrito-detalle.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { CarritoDetalle } from './entities/carrito-detalle.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CarritoDetallesService {
  constructor(
    @InjectRepository(CarritoDetalle)
    private carritoDetallesRepository: Repository<CarritoDetalle>,
  ) {}

  async create(
    createCarritoDetalleDto: CreateCarritoDetalleDto,
  ): Promise<CarritoDetalle> {
    const detalle = new CarritoDetalle();

    // Copia directamente todas las propiedades del DTO a la entidad
    Object.assign(detalle, createCarritoDetalleDto);

    // Guarda en la base de datos
    return this.carritoDetallesRepository.save(detalle);
  }

  async findAll(): Promise<CarritoDetalle[]> {
    return this.carritoDetallesRepository.find({
      relations: {
        producto: true, // relación con Producto
        carrito: true, // relación con Carrito
      },
      select: {
        id: true,
        cantidad: true,
        producto: { id: true, nombre: true, precio: true }, // campos del producto que quieres exponer
        carrito: { id: true, idUsuario: true, estado: true }, // campos del carrito que quieres exponer
      },
      order: {
        id: 'ASC', // o cualquier otro campo
      },
    });
  }

  async findOne(id: number): Promise<CarritoDetalle> {
    const detalle = await this.carritoDetallesRepository.findOne({
      where: { id },
      relations: {
        producto: true, // relación con Producto
        carrito: true, // relación con Carrito
      },
    });

    if (!detalle)
      throw new NotFoundException('El producto en el carrito no existe');

    return detalle;
  }

  async update(
    id: number,
    updateCarritoDetalleDto: UpdateCarritoDetalleDto,
  ): Promise<CarritoDetalle> {
    // Buscar el registro existente
    const detalle = await this.findOne(id);

    // Actualizar los campos con los datos del DTO
    Object.assign(detalle, updateCarritoDetalleDto);

    // Si actualizas idProducto o idCarrito explícitamente, asegúrate de asignarlos
    if (updateCarritoDetalleDto.idProducto !== undefined) {
      detalle.idProducto = updateCarritoDetalleDto.idProducto;
    }

    if (updateCarritoDetalleDto.idCarrito !== undefined) {
      detalle.idCarrito = updateCarritoDetalleDto.idCarrito;
    }

    // Guardar los cambios en la base de datos
    return this.carritoDetallesRepository.save(detalle);
  }

  async remove(id: number): Promise<CarritoDetalle> {
    // Buscar el registro existente
    const detalle = await this.findOne(id);

    // Soft remove: marca el registro como eliminado sin borrarlo físicamente
    return this.carritoDetallesRepository.softRemove(detalle);
  }
}
