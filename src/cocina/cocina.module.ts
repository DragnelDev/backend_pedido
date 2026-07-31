import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pedido } from 'src/pedidos/entities/pedido.entity';
import { RecetaInsumo } from 'src/recetas/entities/receta-insumo.entity';
import { Insumo } from 'src/insumos/entities/insumo.entity';
import { CocinaService } from './cocina.service';
import { CocinaController } from './cocina.controller';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Pedido, RecetaInsumo, Insumo]), AuthModule],
  controllers: [CocinaController],
  providers: [CocinaService],
})
export class CocinaModule {}
