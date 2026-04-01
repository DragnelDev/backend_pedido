import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { Cliente } from './entities/cliente.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class ClientesService {
  constructor(
    @InjectRepository(Cliente)
    private clientesRepository: Repository<Cliente>,
  ) {}

  async create(createClienteDto: CreateClienteDto): Promise<Cliente> {
    const existe = await this.clientesRepository.findOneBy({
      cedulaIdentidad: createClienteDto.cedulaIdentidad.trim(),
      nombre: createClienteDto.nombre.trim(),
    });
    if (existe) throw new ConflictException('El empleado ya existe');
    const empleado = new Cliente();
    Object.assign(empleado, createClienteDto);
    return this.clientesRepository.save(empleado);
  }
  async findAll(): Promise<Cliente[]> {
    return this.clientesRepository.find();
  }

  async findOne(id: number): Promise<Cliente> {
    const empleado = await this.clientesRepository.findOneBy({ id });
    if (!empleado) throw new NotFoundException('El empleado no existe');
    return empleado;
  }

  async update(
    id: number,
    updateClienteDto: UpdateClienteDto,
  ): Promise<Cliente> {
    const empleado = await this.findOne(id);
    const empleadoUpdate = Object.assign(empleado, updateClienteDto);
    return this.clientesRepository.save(empleadoUpdate);
  }

  async remove(id: number): Promise<Cliente> {
    const empleado = await this.findOne(id);
    return this.clientesRepository.softRemove(empleado);
  }
}
