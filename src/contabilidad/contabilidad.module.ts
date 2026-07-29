import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Gasto } from './entities/gasto.entity';
import { CierreCaja } from './entities/cierre-caja.entity';
import { Pago } from 'src/pagos/entities/pago.entity';
import { GastosService } from './gastos.service';
import { GastosController } from './gastos.controller';
import { CierreCajaService } from './cierre-caja.service';
import { CierreCajaController } from './cierre-caja.controller';
import { LibroVentasService } from './libro-ventas.service';
import { LibroVentasController } from './libro-ventas.controller';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Gasto, CierreCaja, Pago]), AuthModule],
  controllers: [GastosController, CierreCajaController, LibroVentasController],
  providers: [GastosService, CierreCajaService, LibroVentasService],
})
export class ContabilidadModule {}
