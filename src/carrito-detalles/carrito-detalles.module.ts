import { Module } from '@nestjs/common';
import { CarritoDetallesService } from './carrito-detalles.service';
import { CarritoDetallesController } from './carrito-detalles.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CarritoDetalle } from './entities/carrito-detalle.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CarritoDetalle])],
  controllers: [CarritoDetallesController],
  providers: [CarritoDetallesService],
})
export class CarritoDetallesModule {}
