import { Pedido } from 'src/pedidos/entities/pedido.entity';
import { Producto } from 'src/productos/entities/producto.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('detalle_pedidos')
export class DetallePedido {
  @PrimaryGeneratedColumn('identity')
  id: number;

  @Column('integer', { name: 'id_pedido' })
  idPedido: number;

  @Column('integer', { name: 'id_producto' })
  idProducto: number;

  @Column('integer')
  cantidad: number;

  @Column('decimal', {
    precision: 12,
    scale: 2,
    default: 0,
    name: 'precio_unitario',
  })
  precioUnitario: number;

  @Column('varchar', { name: 'dedicatoria', length: 255, nullable: true })
  dedicatoria: string;

  /*@Column('decimal', {
    precision: 12,
    scale: 2,
    default: 0,
    nullable: true,
  })
  descuento: number;

  @Column('decimal', {
    precision: 12,
    scale: 2,
    default: 0,
    name: 'sub_total',
  })
  subTotal: number;

  @Column('varchar', { name: 'estado_detalle' })
  estadoDetalle: string;*/

  @ManyToOne(() => Pedido, (pedido) => pedido.detallePedido)
  @JoinColumn({ name: 'id_pedido', referencedColumnName: 'id' })
  pedido: Pedido;

  @ManyToOne(() => Producto)
  @JoinColumn({ name: 'id_producto', referencedColumnName: 'id' })
  producto: Producto;
}
