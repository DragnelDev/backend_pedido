import { Empleado } from 'src/empleados/entities/empleado.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

// Un único cierre de caja por día (arqueo).
@Entity('cierres_caja')
@Unique('uq_cierre_caja_fecha', ['fecha'])
export class CierreCaja {
  @PrimaryGeneratedColumn('identity')
  id: number;

  @Column('date')
  fecha: string;

  @Column('integer', { name: 'id_empleado' })
  idEmpleado: number;

  // Fondo con el que se abrió la caja ese día
  @Column('decimal', { precision: 10, scale: 2, name: 'monto_inicial' })
  montoInicial: number;

  // Snapshot de lo calculado por el sistema al momento del cierre
  // (no se recalcula después, para preservar el histórico del arqueo)
  @Column('decimal', {
    precision: 10,
    scale: 2,
    name: 'ventas_efectivo_sistema',
  })
  ventasEfectivoSistema: number;

  @Column('decimal', {
    precision: 10,
    scale: 2,
    name: 'ventas_digital_sistema',
  })
  ventasDigitalSistema: number;

  @Column('decimal', { precision: 10, scale: 2, name: 'efectivo_contado' })
  efectivoContado: number;

  @Column('decimal', { precision: 10, scale: 2 })
  diferencia: number;

  @Column('varchar', { length: 500, nullable: true })
  observaciones: string | null;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;

  @ManyToOne(() => Empleado)
  @JoinColumn({ name: 'id_empleado', referencedColumnName: 'id' })
  empleado: Empleado;
}
