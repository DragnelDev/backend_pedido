import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

export interface MetodoQr {
  activo: boolean;
  banco: string;
  titular: string;
  imagenQrUrl: string;
}

export interface MetodoTransferencia {
  activo: boolean;
  banco: string;
  tipoCuenta: string;
  numeroCuenta: string;
  titular: string;
  ciNit: string;
}

export interface MetodoEfectivo {
  activo: boolean;
  descripcion: string;
}

export interface MetodosPago {
  qr: MetodoQr;
  transferencia: MetodoTransferencia;
  efectivo: MetodoEfectivo;
}

export const METODOS_PAGO_POR_DEFECTO: MetodosPago = {
  qr: { activo: false, banco: '', titular: '', imagenQrUrl: '' },
  transferencia: {
    activo: false,
    banco: '',
    tipoCuenta: '',
    numeroCuenta: '',
    titular: '',
    ciNit: '',
  },
  efectivo: { activo: true, descripcion: 'Pago contra entrega o en sucursal' },
};

// Tabla de configuración global del sistema. Se maneja como fila única
// (id fijo = 1) porque solo existe una configuración por pastelería.
@Entity('configuracion')
export class Configuracion {
  @PrimaryColumn('smallint', { default: 1 })
  id: number;

  @Column('varchar', { length: 100, default: 'Berry Sweet' })
  nombre: string;

  @Column('varchar', { length: 20, nullable: true })
  nit: string;

  @Column('varchar', { length: 255, nullable: true })
  direccion: string;

  @Column('varchar', { length: 20, name: 'telefono_whatsapp', nullable: true })
  telefonoWhatsapp: string;

  @Column('varchar', { length: 100, name: 'email_contacto', nullable: true })
  emailContacto: string;

  @Column('varchar', { length: 500, name: 'logo_url', nullable: true })
  logoUrl: string;

  @Column('jsonb', {
    name: 'metodos_pago',
    default: () => `'${JSON.stringify(METODOS_PAGO_POR_DEFECTO)}'`,
  })
  metodosPago: MetodosPago;

  @UpdateDateColumn({ name: 'fecha_modificacion' })
  fechaModificacion: Date;
}
