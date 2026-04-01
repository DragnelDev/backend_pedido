import { Usuario } from 'src/usuarios/entities/usuario.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('empleados')
export class Empleado {
  @PrimaryGeneratedColumn('identity')
  id: number;

  @Column('varchar', { length: 12, name: 'cedula_identidad ' })
  cedulaIdentidad: string;

  @Column('varchar', { length: 50 })
  nombre: string;

  @Column('varchar', { length: 50, name: 'apellido_paterno ' })
  apellidoPaterno: string;

  @Column('varchar', { length: 50, name: 'apellido_materno ' })
  apellidoMaterno: string;

  @Column({ type: 'date', name: 'fecha_nacimiento ' })
  fechaNacimiento: Date;

  @Column('varchar', { length: 80 })
  direccion: string;

  @Column('varchar', { length: 12 })
  celular: string;

  @Column('varchar', { length: 40 })
  email: string;

  @Column('date', { name: 'fecha_ingreso ' })
  fechaIngreso: Date;

  @Column('varchar', { length: 15 })
  cargo: string;

  @Column('decimal', { precision: 10, scale: 2 })
  salario: number;

  @Column('boolean', { name: 'activo', default: true })
  activo: boolean;

  // Columnas de Auditoria
  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;

  @UpdateDateColumn({ name: 'fecha_modificacion' })
  fechaModificacion: Date;

  @DeleteDateColumn({ name: 'fecha_eliminacion' })
  fechaEliminacion: Date;

  @OneToMany(() => Usuario, (usuario) => usuario.empleado)
  usuarios: Usuario[];
}
