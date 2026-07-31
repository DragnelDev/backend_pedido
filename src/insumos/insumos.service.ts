import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Insumo } from './entities/insumo.entity';
import { CreateInsumoDto } from './dto/create-insumo.dto';
import { UpdateInsumoDto } from './dto/update-insumo.dto';
import { AjustarStockDto } from './dto/ajustar-stock.dto';

@Injectable()
export class InsumosService {
  constructor(
    @InjectRepository(Insumo)
    private readonly insumosRepository: Repository<Insumo>,
  ) {}

  async findAll(soloBajoStock = false): Promise<Insumo[]> {
    const insumos = await this.insumosRepository.find({
      where: { activo: true },
      order: { categoria: 'ASC', nombre: 'ASC' },
    });

    if (!soloBajoStock) return insumos;
    return insumos.filter((i) => Number(i.stock) <= Number(i.stockMinimo));
  }

  async findOne(id: number): Promise<Insumo> {
    const insumo = await this.insumosRepository.findOneBy({ id });
    if (!insumo) throw new NotFoundException('El insumo no existe');
    return insumo;
  }

  async create(dto: CreateInsumoDto): Promise<Insumo> {
    const insumo = this.insumosRepository.create(dto);
    return this.insumosRepository.save(insumo);
  }

  async update(id: number, dto: UpdateInsumoDto): Promise<Insumo> {
    const insumo = await this.findOne(id);
    Object.assign(insumo, dto);
    return this.insumosRepository.save(insumo);
  }

  async remove(id: number): Promise<{ message: string }> {
    const insumo = await this.findOne(id);
    await this.insumosRepository.softRemove(insumo);
    return { message: 'Insumo eliminado correctamente' };
  }

  async ajustarStock(id: number, dto: AjustarStockDto): Promise<Insumo> {
    const insumo = await this.findOne(id);

    if (dto.tipo === 'salida' && Number(insumo.stock) < dto.cantidad) {
      throw new BadRequestException(
        `No hay suficiente stock de "${insumo.nombre}" para esta salida`,
      );
    }

    insumo.stock =
      dto.tipo === 'entrada'
        ? Number(insumo.stock) + dto.cantidad
        : Number(insumo.stock) - dto.cantidad;

    return this.insumosRepository.save(insumo);
  }
}
