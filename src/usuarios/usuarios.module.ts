import { Module } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { UsuariosController } from './usuarios.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from './entities/usuario.entity';
import { EmpleadosModule } from 'src/empleados/empleados.module';
import { ClientesModule } from 'src/clientes/clientes.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario]),
    EmpleadosModule,
    ClientesModule,
  ],
  controllers: [UsuariosController],
  providers: [UsuariosService],
  exports: [UsuariosService],
})
export class UsuariosModule {}
