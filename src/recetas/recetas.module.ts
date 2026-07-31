import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecetaInsumo } from './entities/receta-insumo.entity';
import { Producto } from 'src/productos/entities/producto.entity';
import { RecetasService } from './recetas.service';
import { RecetasController } from './recetas.controller';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([RecetaInsumo, Producto]), AuthModule],
  controllers: [RecetasController],
  providers: [RecetasService],
  exports: [TypeOrmModule],
})
export class RecetasModule {}
