import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { CarritoDetallesService } from './carrito-detalles.service';
import { CreateCarritoDetalleDto } from './dto/create-carrito-detalle.dto';
import { UpdateCarritoDetalleDto } from './dto/update-carrito-detalle.dto';

@Controller('carrito-detalles')
export class CarritoDetallesController {
  constructor(
    private readonly carritoDetallesService: CarritoDetallesService,
  ) {}

  @Post()
  create(@Body() createCarritoDetalleDto: CreateCarritoDetalleDto) {
    return this.carritoDetallesService.create(createCarritoDetalleDto);
  }

  @Get()
  findAll() {
    return this.carritoDetallesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.carritoDetallesService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCarritoDetalleDto: UpdateCarritoDetalleDto,
  ) {
    return this.carritoDetallesService.update(+id, updateCarritoDetalleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.carritoDetallesService.remove(+id);
  }
}
