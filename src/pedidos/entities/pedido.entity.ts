import { Cliente } from 'src/clientes/entities/cliente.entity';
import { DetallePedido } from 'src/detalle-pedidos/entities/detalle-pedido.entity';
import { Pago } from 'src/pagos/entities/pago.entity';
import { Usuario } from 'src/usuarios/entities/usuario.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('pedidos')
export class Pedido {
  @PrimaryGeneratedColumn('identity')
  id: number;

  @Column('integer', { name: 'id_usuario' })
  idUsuario: number;

  @Column('timestamp', {
    name: 'fecha_pedido',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fechaPedido: Date;

  @Column('date', { name: 'fecha_entrega' })
  fechaEntrega: Date;

  @Column('varchar', {
    length: 255,
    name: 'direccion_envio',
    default: 'Sin dirección',
  })
  direccionEnvio: string;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'tipo_envio' })
  tipoEnvio?: string;

  @Column('varchar', { length: 255, name: 'referencia', nullable: true })
  referencia?: string;

  @Column('varchar', { length: 50, default: 'pendiente', name: 'estado' })
  estado: string;

  // Columnas de auditoria
  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;

  @UpdateDateColumn({ name: 'fecha_modificacion' })
  fechaModificacion: Date;

  @DeleteDateColumn({ name: 'fecha_eliminacion' })
  fechaEliminacion: Date;

  @ManyToOne(() => Cliente, (cliente) => cliente.pedidos)
  @JoinColumn({ name: 'id_cliente', referencedColumnName: 'id' })
  cliente: Cliente;

  @ManyToOne(() => Usuario, (usuario) => usuario.pedidos)
  @JoinColumn({ name: 'id_usuario', referencedColumnName: 'id' })
  usuario: Usuario;

  @OneToMany(() => DetallePedido, (detalle) => detalle.pedido, {
    cascade: true,
  })
  detallePedido: DetallePedido[];

  @OneToMany(() => Pago, (Pago) => Pago.pedido)
  pagos: Pago[];
}
