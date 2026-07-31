import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { RecetaInsumo } from './entities/receta-insumo.entity';
import { Producto } from 'src/productos/entities/producto.entity';
import { ReemplazarRecetaDto } from './dto/reemplazar-receta.dto';

@Injectable()
export class RecetasService {
  constructor(
    @InjectRepository(RecetaInsumo)
    private readonly recetaRepository: Repository<RecetaInsumo>,

    @InjectRepository(Producto)
    private readonly productosRepository: Repository<Producto>,

    private readonly dataSource: DataSource,
  ) {}

  async findByProducto(idProducto: number): Promise<RecetaInsumo[]> {
    await this.verificarProducto(idProducto);
    return this.recetaRepository.find({
      where: { idProducto },
      relations: { insumo: true },
      order: { id: 'ASC' },
    });
  }

  async reemplazar(
    idProducto: number,
    dto: ReemplazarRecetaDto,
  ): Promise<RecetaInsumo[]> {
    await this.verificarProducto(idProducto);

    // Reemplazo atómico: se borra la receta anterior y se inserta la nueva
    // dentro de una misma transacción para no dejar el producto sin receta
    // a medias si algo falla.
    await this.dataSource.transaction(async (manager) => {
      await manager.delete(RecetaInsumo, { idProducto });

      const nuevosItems = dto.items.map((item) =>
        manager.create(RecetaInsumo, {
          idProducto,
          idInsumo: item.idInsumo,
          cantidadPorUnidad: item.cantidadPorUnidad,
        }),
      );
      await manager.save(nuevosItems);
    });

    return this.findByProducto(idProducto);
  }

  private async verificarProducto(idProducto: number): Promise<void> {
    const existe = await this.productosRepository.findOneBy({ id: idProducto });
    if (!existe) throw new NotFoundException('El producto no existe');
  }
}
