import { Empleado } from 'src/empleados/entities/empleado.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export const CATEGORIAS_GASTO = [
  'insumos',
  'servicios',
  'empaques',
  'mantenimiento',
  'otros',
] as const;

export type CategoriaGasto = (typeof CATEGORIAS_GASTO)[number];

@Entity('gastos')
export class Gasto {
  @PrimaryGeneratedColumn('identity')
  id: number;

  @Column('integer', { name: 'id_empleado' })
  idEmpleado: number;

  // Fecha en que se realizó el gasto (puede diferir de la fecha de registro)
  @Column('date')
  fecha: string;

  @Column('varchar', { length: 150 })
  concepto: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'otros',
  })
  categoria: CategoriaGasto;

  @Column('decimal', { precision: 10, scale: 2 })
  monto: number;

  @Column('varchar', { length: 100, nullable: true })
  comprobante: string | null;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;

  @UpdateDateColumn({ name: 'fecha_modificacion' })
  fechaModificacion: Date;

  @DeleteDateColumn({ name: 'fecha_eliminacion' })
  fechaEliminacion: Date;

  @ManyToOne(() => Empleado)
  @JoinColumn({ name: 'id_empleado', referencedColumnName: 'id' })
  empleado: Empleado;
}
