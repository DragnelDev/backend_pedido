import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { InsumosService } from './insumos.service';
import { CreateInsumoDto } from './dto/create-insumo.dto';
import { UpdateInsumoDto } from './dto/update-insumo.dto';
import { AjustarStockDto } from './dto/ajustar-stock.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Usuario } from 'src/usuarios/entities/usuario.entity';

@ApiTags('insumos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('insumos')
export class InsumosController {
  constructor(private readonly insumosService: InsumosService) {}

  @Get()
  findAll(@Query('bajoStock') bajoStock: string | undefined, @CurrentUser() usuario: Usuario) {
    this.verificarEmpleado(usuario);
    return this.insumosService.findAll(bajoStock === 'true');
  }

  @Get(':id')
  findOne(@CurrentUser() usuario: Usuario, @Param('id', ParseIntPipe) id: number) {
    this.verificarEmpleado(usuario);
    return this.insumosService.findOne(id);
  }

  @Post()
  create(@CurrentUser() usuario: Usuario, @Body() dto: CreateInsumoDto) {
    this.verificarEmpleado(usuario);
    return this.insumosService.create(dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() usuario: Usuario,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateInsumoDto,
  ) {
    this.verificarEmpleado(usuario);
    return this.insumosService.update(id, dto);
  }

  @Patch(':id/ajustar-stock')
  ajustarStock(
    @CurrentUser() usuario: Usuario,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AjustarStockDto,
  ) {
    this.verificarEmpleado(usuario);
    return this.insumosService.ajustarStock(id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() usuario: Usuario, @Param('id', ParseIntPipe) id: number) {
    this.verificarEmpleado(usuario);
    return this.insumosService.remove(id);
  }

  private verificarEmpleado(usuario: Usuario): void {
    if (!usuario.idEmpleado) {
      throw new ForbiddenException('Solo el personal de la pastelería puede acceder a esta información');
    }
  }
}
