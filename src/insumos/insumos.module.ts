import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Insumo } from './entities/insumo.entity';
import { InsumosService } from './insumos.service';
import { InsumosController } from './insumos.controller';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Insumo]), AuthModule],
  controllers: [InsumosController],
  providers: [InsumosService],
  exports: [InsumosService, TypeOrmModule],
})
export class InsumosModule {}
