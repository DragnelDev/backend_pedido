import { Insumo } from 'src/insumos/entities/insumo.entity';
import { Producto } from 'src/productos/entities/producto.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

// Receta / lista de materiales (BOM): cuánto de cada insumo se necesita
// para preparar 1 unidad (o porción) de un producto.
@Entity('receta_insumos')
@Unique('uq_receta_producto_insumo', ['idProducto', 'idInsumo'])
export class RecetaInsumo {
  @PrimaryGeneratedColumn('identity')
  id: number;

  @Column('integer', { name: 'id_producto' })
  idProducto: number;

  @Column('integer', { name: 'id_insumo' })
  idInsumo: number;

  // Cantidad de insumo (en su unidad de medida) requerida por cada
  // unidad del producto terminado.
  @Column('decimal', { precision: 10, scale: 3, name: 'cantidad_por_unidad' })
  cantidadPorUnidad: number;

  @ManyToOne(() => Producto)
  @JoinColumn({ name: 'id_producto', referencedColumnName: 'id' })
  producto: Producto;

  @ManyToOne(() => Insumo)
  @JoinColumn({ name: 'id_insumo', referencedColumnName: 'id' })
  insumo: Insumo;
}
