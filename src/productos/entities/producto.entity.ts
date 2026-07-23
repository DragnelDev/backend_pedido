import { Categoria } from 'src/categorias/entities/categoria.entity';
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

@Entity('productos')
export class Producto {
  @PrimaryGeneratedColumn('identity')
  id: number;

  @Column({ nullable: true, name: 'id_categoria' })
  idCategoria: number;

  @Column('varchar', { length: 80 })
  nombre: string;

  @Column('text', { nullable: true })
  descripcion: string;

  @Column('decimal', { precision: 10, scale: 2 })
  precio: number;

  @Column('int', { default: 0 })
  stock: number;

  @Column('int', { nullable: true })
  porciones: number; // Específico para pastelería

  @Column('int', { nullable: true, name: 'tiempo_preparacion' })
  tiempoPreparacion: number;

  @Column({ name: 'imagen_url', type: 'varchar', length: 500, nullable: true })
  imagenUrl: string;

  // Columnas de auditoria
  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;

  @UpdateDateColumn({ name: 'fecha_modificacion' })
  fechaModificacion: Date;

  @DeleteDateColumn({ name: 'fecha_eliminacion' })
  fechaEliminacion: Date;

  @ManyToOne(() => Categoria, (categoria) => categoria.productos)
  @JoinColumn({ name: 'id_categoria', referencedColumnName: 'id' })
  categoria: Categoria;
}
