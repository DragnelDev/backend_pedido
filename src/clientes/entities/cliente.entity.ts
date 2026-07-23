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

@Entity('clientes')
export class Cliente {
  @PrimaryGeneratedColumn('identity')
  id: number;

  @Column({
    name: 'cedula_identidad',
    type: 'varchar',
    length: 12,
  })
  cedulaIdentidad: string;

  @Column('varchar', { length: 50 })
  nombre: string;

  @Column('varchar', { length: 50, name: 'apellido_paterno' })
  apellidoPaterno: string;

  @Column('varchar', { length: 50, name: 'apellido_materno' })
  apellidoMaterno: string;

  @Column('varchar', { length: 12 })
  celular: string;

  @Column('varchar', { length: 40 })
  email: string;

  @Column('varchar', { length: 80 })
  direccion: string;

  /*@Column('varchar', { length: 20, name: 'tipo_cliente', nullable: true })
  tipoCliente: string;

  @Column('varchar', { length: 500, nullable: true })
  preferencias: string;*/

  // Columnas de Auditoria
  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;

  @UpdateDateColumn({ name: 'fecha_modificacion' })
  fechaModificacion: Date;

  @DeleteDateColumn({ name: 'fecha_eliminacion' })
  fechaEliminacion: Date;

  @OneToMany(() => Usuario, (usuario) => usuario.cliente)
  usuarios: Usuario[];
}
