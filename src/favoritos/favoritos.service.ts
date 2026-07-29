import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorito } from './entities/favorito.entity';
import { Producto } from 'src/productos/entities/producto.entity';
import { CreateFavoritoDto } from './dto/create-favorito.dto';

@Injectable()
export class FavoritosService {
  constructor(
    @InjectRepository(Favorito)
    private readonly favoritosRepository: Repository<Favorito>,

    @InjectRepository(Producto)
    private readonly productosRepository: Repository<Producto>,
  ) {}

  async findAllByCliente(idCliente: number): Promise<Favorito[]> {
    return this.favoritosRepository.find({
      where: { idCliente },
      relations: { producto: { categoria: true } },
      order: { fechaCreacion: 'DESC' },
    });
  }

  async agregar(
    idCliente: number,
    createFavoritoDto: CreateFavoritoDto,
  ): Promise<Favorito> {
    const { idProducto } = createFavoritoDto;

    const producto = await this.productosRepository.findOneBy({
      id: idProducto,
    });
    if (!producto) throw new NotFoundException('El producto no existe');

    const yaExiste = await this.favoritosRepository.findOneBy({
      idCliente,
      idProducto,
    });
    if (yaExiste) {
      throw new ConflictException('El producto ya está en tus favoritos');
    }

    const favorito = this.favoritosRepository.create({
      idCliente,
      idProducto,
    });
    return this.favoritosRepository.save(favorito);
  }

  async eliminar(
    idCliente: number,
    idProducto: number,
  ): Promise<{ message: string }> {
    const favorito = await this.favoritosRepository.findOneBy({
      idCliente,
      idProducto,
    });
    if (!favorito) {
      throw new NotFoundException('El producto no está en tus favoritos');
    }

    await this.favoritosRepository.remove(favorito);
    return { message: 'Producto eliminado de favoritos' };
  }
}
