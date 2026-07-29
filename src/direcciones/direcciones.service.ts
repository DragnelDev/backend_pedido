import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Direccion } from './entities/direccion.entity';
import { CreateDireccionDto } from './dto/create-direccion.dto';
import { UpdateDireccionDto } from './dto/update-direccion.dto';

@Injectable()
export class DireccionesService {
  constructor(
    @InjectRepository(Direccion)
    private readonly direccionesRepository: Repository<Direccion>,
  ) {}

  async findAllByCliente(idCliente: number): Promise<Direccion[]> {
    return this.direccionesRepository.find({
      where: { idCliente },
      order: { principal: 'DESC', fechaCreacion: 'DESC' },
    });
  }

  async create(
    idCliente: number,
    createDireccionDto: CreateDireccionDto,
  ): Promise<Direccion> {
    const esLaPrimera =
      (await this.direccionesRepository.count({
        where: { idCliente },
      })) === 0;

    const direccion = this.direccionesRepository.create({
      ...createDireccionDto,
      idCliente,
      // La primera dirección registrada siempre queda como principal
      principal: esLaPrimera ? true : Boolean(createDireccionDto.principal),
    });

    if (direccion.principal) {
      await this.desmarcarPrincipales(idCliente);
    }

    return this.direccionesRepository.save(direccion);
  }

  async findOneDeCliente(id: number, idCliente: number): Promise<Direccion> {
    const direccion = await this.direccionesRepository.findOneBy({ id });
    if (!direccion) throw new NotFoundException('La dirección no existe');
    if (direccion.idCliente !== idCliente) {
      throw new ForbiddenException(
        'No tienes permiso para acceder a esta dirección',
      );
    }
    return direccion;
  }

  async update(
    id: number,
    idCliente: number,
    updateDireccionDto: UpdateDireccionDto,
  ): Promise<Direccion> {
    const direccion = await this.findOneDeCliente(id, idCliente);

    if (updateDireccionDto.principal) {
      await this.desmarcarPrincipales(idCliente);
    }

    Object.assign(direccion, updateDireccionDto);
    return this.direccionesRepository.save(direccion);
  }

  async marcarComoPrincipal(id: number, idCliente: number): Promise<Direccion> {
    const direccion = await this.findOneDeCliente(id, idCliente);
    await this.desmarcarPrincipales(idCliente);
    direccion.principal = true;
    return this.direccionesRepository.save(direccion);
  }

  async remove(id: number, idCliente: number): Promise<{ message: string }> {
    const direccion = await this.findOneDeCliente(id, idCliente);
    const eraPrincipal = direccion.principal;

    await this.direccionesRepository.softRemove(direccion);

    // Si se eliminó la dirección principal, se promueve la más reciente restante
    if (eraPrincipal) {
      const [siguiente] = await this.findAllByCliente(idCliente);
      if (siguiente) {
        siguiente.principal = true;
        await this.direccionesRepository.save(siguiente);
      }
    }

    return { message: 'Dirección eliminada correctamente' };
  }

  private async desmarcarPrincipales(idCliente: number): Promise<void> {
    await this.direccionesRepository.update(
      { idCliente, principal: true },
      { principal: false },
    );
  }
}
