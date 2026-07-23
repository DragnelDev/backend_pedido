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
    });
    if (existe) throw new ConflictException('El cliente ya existe');
    const cliente = new Cliente();
    Object.assign(cliente, createClienteDto);
    return this.clientesRepository.save(cliente);
  }

  async findByCedulaIdentidadOrEmail(
    cedulaIdentidad?: string,
    email?: string,
  ): Promise<Cliente> {
    const query = this.clientesRepository.createQueryBuilder('cliente');

    if (cedulaIdentidad) {
      query.orWhere('cliente.cedulaIdentidad = :cedulaIdentidad', {
        cedulaIdentidad: cedulaIdentidad.trim(),
      });
    }
    if (email) {
      query.orWhere('cliente.email = :email', {
        email: email.trim(),
      });
    }

    const cliente = await query.getOne();
    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }
    return cliente;
  }

  async findAll(): Promise<Cliente[]> {
    return this.clientesRepository.find();
  }

  async findOne(id: number): Promise<Cliente> {
    const cliente = await this.clientesRepository.findOneBy({ id });
    if (!cliente) throw new NotFoundException('El cliente no existe');
    return cliente;
  }

  async update(
    id: number,
    updateClienteDto: UpdateClienteDto,
  ): Promise<Cliente> {
    const cliente = await this.findOne(id);
    const clienteUpdate = Object.assign(cliente, updateClienteDto);
    return this.clientesRepository.save(clienteUpdate);
  }

  async remove(id: number): Promise<Cliente> {
    const cliente = await this.findOne(id);
    return this.clientesRepository.softRemove(cliente);
  }
}
