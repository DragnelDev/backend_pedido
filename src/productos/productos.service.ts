import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, IsNull, Repository } from 'typeorm';
import { Producto } from './entities/producto.entity';

@Injectable()
export class ProductosService {
  constructor(
    @InjectRepository(Producto)
    private productosRepository: Repository<Producto>,
  ) {}

  async create(createProductoDto: CreateProductoDto): Promise<Producto> {
    let producto = await this.productosRepository.findOneBy({
      idCategoria: createProductoDto.idCategoria,
      nombre: createProductoDto.nombre,
    });
    if (producto) throw new ConflictException('El producto ya existe');

    producto = new Producto();
    Object.assign(producto, createProductoDto);
    return this.productosRepository.save(producto);
  }

  async findAll(parametro?: string): Promise<Producto[]> {
    const searchTerm = parametro ? parametro.trim() : '';

    let whereCondition: any = { fechaEliminacion: IsNull() };

    if (searchTerm.length > 0) {
      // Aplicamos el filtro si hay un término
      whereCondition = [
        { nombre: ILike(`%${searchTerm}%`), fechaEliminacion: IsNull() },
        { descripcion: ILike(`%${searchTerm}%`), fechaEliminacion: IsNull() },
      ];
    }

    return this.productosRepository.find({
      where: whereCondition,
      relations: ['categoria'],
      order: { nombre: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Producto> {
    const producto = await this.productosRepository.findOne({
      where: { id },
      relations: { categoria: true },
    });
    if (!producto) throw new NotFoundException('El producto no existe');
    return producto;
  }

  async findByCategoria(idCategoria: number): Promise<Producto[]> {
    return await this.productosRepository.find({
      where: { idCategoria },
      order: { nombre: 'ASC' },
    });
  }

  async update(
    id: number,
    updateProductoDto: UpdateProductoDto,
  ): Promise<Producto> {
    //const producto = await this.findOne(id);
    const producto = await this.productosRepository.findOneBy({ id });
    if (!producto) throw new NotFoundException('El producto no existe');
    Object.assign(producto, updateProductoDto);
    return this.productosRepository.save(producto);
  }

  async remove(id: number): Promise<Producto> {
    const producto = await this.findOne(id);
    return this.productosRepository.softRemove(producto);
  }

  async obtenerPorCategoria(idCategoria: number): Promise<Producto[]> {
    return await this.productosRepository.find({
      where: { idCategoria, fechaEliminacion: IsNull() },
      relations: ['categoria'],
      order: { nombre: 'ASC' },
    });
  }

  async incrementarStock(
    idProducto: number,
    cantidad: number,
  ): Promise<Producto> {
    const producto = await this.productosRepository.findOneBy({
      id: idProducto,
    });

    if (!producto) {
      throw new NotFoundException('El producto no existe');
    }

    // sumamos la cantidad comprada al stock actual
    producto.stock = (producto.stock ?? 0) + cantidad;

    return this.productosRepository.save(producto);
  }

  async disminuirStock(
    idProducto: number,
    cantidad: number,
  ): Promise<Producto> {
    const producto = await this.productosRepository.findOneBy({
      id: idProducto,
    });

    if (!producto) {
      throw new NotFoundException('El producto no existe');
    }

    const nuevoStock = (producto.stock ?? 0) - cantidad;

    if (nuevoStock < 0) {
      // opcional: puedes dejar que llegue a cero o lanzar error
      throw new BadRequestException('Stock insuficiente para este producto');
    }

    producto.stock = nuevoStock;

    return this.productosRepository.save(producto);
  }
}
