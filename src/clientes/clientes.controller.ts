import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ClientesService } from './clientes.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';

@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Post()
  create(@Body() createClienteDto: CreateClienteDto) {
    return this.clientesService.create(createClienteDto);
  }

  @Get()
  findAll() {
    return this.clientesService.findAll();
  }

  @Get('buscar')
  buscar(
    @Query('q') q?: string,
    @Query('ci') ci?: string,
    @Query('email') email?: string,
  ) {
    const valor = q?.trim() || ci?.trim() || email?.trim();
    if (!valor) {
      throw new BadRequestException(
        'Debe proporcionar ci o email para buscar al cliente',
      );
    }

    const esEmail = Boolean(email?.trim() || q?.includes('@'));
    return this.clientesService.findByCedulaIdentidadOrEmail(
      esEmail ? undefined : valor,
      esEmail ? valor : undefined,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clientesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateClienteDto: UpdateClienteDto) {
    return this.clientesService.update(+id, updateClienteDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.clientesService.remove(+id);
  }
}
