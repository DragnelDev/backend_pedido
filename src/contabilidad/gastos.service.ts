import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Gasto } from './entities/gasto.entity';
import { CreateGastoDto } from './dto/create-gasto.dto';
import { UpdateGastoDto } from './dto/update-gasto.dto';
import { rangoDelMes, hoyIso } from './contabilidad.utils';

@Injectable()
export class GastosService {
  constructor(
    @InjectRepository(Gasto)
    private readonly gastosRepository: Repository<Gasto>,
  ) {}

  async create(idEmpleado: number, dto: CreateGastoDto): Promise<Gasto> {
    const gasto = this.gastosRepository.create({
      ...dto,
      fecha: dto.fecha ?? hoyIso(),
      idEmpleado,
    });
    return this.gastosRepository.save(gasto);
  }

  async findAll(mes?: string): Promise<Gasto[]> {
    const { desde, hasta } = rangoDelMes(mes);
    return this.gastosRepository.find({
      where: { fecha: Between(desde, hasta) },
      order: { fecha: 'DESC', id: 'DESC' },
    });
  }

  async resumenMes(
    mes?: string,
  ): Promise<{ mes: string; total: number; cantidad: number }> {
    const gastos = await this.findAll(mes);
    const total = gastos.reduce((acc, g) => acc + Number(g.monto), 0);
    return {
      mes: mes ?? hoyIso().slice(0, 7),
      total: Number(total.toFixed(2)),
      cantidad: gastos.length,
    };
  }

  async remove(id: number): Promise<{ message: string }> {
    const gasto = await this.gastosRepository.findOneBy({ id });
    if (!gasto) throw new NotFoundException('El gasto no existe');
    await this.gastosRepository.softRemove(gasto);
    return { message: 'Gasto eliminado correctamente' };
  }
}
