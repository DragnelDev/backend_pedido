import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export const UNIDADES_MEDIDA = ['kg', 'g', 'l', 'ml', 'uds'] as const;
export type UnidadMedida = (typeof UNIDADES_MEDIDA)[number];

@Entity('insumos')
export class Insumo {
  @PrimaryGeneratedColumn('identity')
  id: number;

  @Column('varchar', { length: 80 })
  nombre: string;

  // Categoría libre para agrupar en la UI (Secos, Frutas, Lácteos, Empaques, etc.)
  @Column('varchar', { length: 40, default: 'Otros' })
  categoria: string;

  @Column({ type: 'varchar', length: 10, name: 'unidad_medida' })
  unidadMedida: UnidadMedida;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  stock: number;

  @Column('decimal', { precision: 10, scale: 2, name: 'stock_minimo', default: 0 })
  stockMinimo: number;

  @Column('decimal', {
    precision: 10,
    scale: 2,
    name: 'costo_unitario',
    nullable: true,
  })
  costoUnitario: number | null;

  @Column('boolean', { default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;

  @UpdateDateColumn({ name: 'fecha_modificacion' })
  fechaModificacion: Date;

  @DeleteDateColumn({ name: 'fecha_eliminacion' })
  fechaEliminacion: Date;
}
