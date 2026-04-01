import { Carrito } from 'src/carritos/entities/carrito.entity';
import { Producto } from 'src/productos/entities/producto.entity';
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

@Entity('carrito_detalles')
export class CarritoDetalle {
  @PrimaryGeneratedColumn('identity')
  id: number;

  @Column('integer', { name: 'id_carrito' })
  idCarrito: number;

  @Column('integer', { name: 'id_producto' })
  idProducto: number;

  @Column('integer')
  cantidad: number;

  /*@Column('decimal', {
    precision: 12,
    scale: 2,
    default: 0,
    name: 'precio_unitario',
  })
  precioUnitario: number;

  @Column('decimal', {
    precision: 12,
    scale: 2,
    default: 0,
    name: 'sub_total',
  })
  subTotal: number;*/

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;

  @UpdateDateColumn({ name: 'fecha_modificacion' })
  fechaModificacion: Date;

  @DeleteDateColumn({ name: 'fecha_eliminacion' })
  fechaEliminacion: Date;

  @ManyToOne(() => Carrito, (car) => car.detalles)
  @JoinColumn({ name: 'id_carrito', referencedColumnName: 'id' })
  carrito: Carrito;

  @ManyToOne(() => Producto)
  @JoinColumn({ name: 'id_producto', referencedColumnName: 'id' })
  producto: Producto;
}
