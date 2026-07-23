import { compare, genSalt, hash } from 'bcrypt';
import { Carrito } from 'src/carritos/entities/carrito.entity';
import { Cliente } from 'src/clientes/entities/cliente.entity';
import { Empleado } from 'src/empleados/entities/empleado.entity';
import { Pedido } from 'src/pedidos/entities/pedido.entity';
import {
  BeforeInsert,
  BeforeUpdate,
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

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn('identity')
  id: number;

  @Column('integer', { name: 'id_empleado', nullable: true })
  idEmpleado: number;

  @Column('integer', { name: 'id_cliente', nullable: true })
  idCliente: number;

  @Column({ name: 'imagen_url', type: 'varchar', length: 500, nullable: true })
  imagenUrl: string;

  @Column('varchar', { length: 100 })
  email: string;

  @Column('varchar', { length: 255, nullable: true })
  clave: string;

  @Column({
    name: 'fecha_cambio_clave',
    default: null,
  })
  fechaCambioClave: Date;

  @Column({
    type: 'varchar',
    length: 20,
    enum: ['EMPLEADO', 'CLIENTE'],
  })
  rol: string;

  @Column('boolean', { name: 'activo', default: true })
  activo: boolean;

  // Columnas de Auditoria
  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;

  @UpdateDateColumn({ name: 'fecha_modificacion' })
  fechaModificacion: Date;

  @DeleteDateColumn({ name: 'fecha_eliminacion' })
  fechaEliminacion: Date;

  @ManyToOne(() => Empleado, (empleado) => empleado.usuarios)
  @JoinColumn({ name: 'id_empleado', referencedColumnName: 'id' })
  empleado: Empleado;

  @ManyToOne(() => Cliente, (cliente) => cliente.usuarios)
  @JoinColumn({ name: 'id_cliente', referencedColumnName: 'id' })
  cliente: Cliente;

  @OneToMany(() => Carrito, (carrito) => carrito.usuario)
  carritos: Carrito[];

  // Relación con Pedidos (Un usuario registra muchos pedidos)
  @OneToMany(() => Pedido, (pedido) => pedido.usuario)
  pedidos: Pedido[];

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    // Solo hashear si la contraseña no está vacía y no comienza con $2 (ya hasheada)
    if (this.clave && !this.clave.startsWith('$2')) {
      const salt = await genSalt();
      this.clave = await hash(this.clave, salt);
    }
  }

  async validatePassword(plainPassword: string): Promise<boolean> {
    return compare(plainPassword, this.clave);
  }
}
