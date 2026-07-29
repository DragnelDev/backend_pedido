import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CierreCaja } from './entities/cierre-caja.entity';
import { Pago } from 'src/pagos/entities/pago.entity';
import { CreateCierreCajaDto } from './dto/create-cierre-caja.dto';
import { hoyIso } from './contabilidad.utils';

// Métodos de pago que se consideran "digitales" (no efectivo físico en caja)
const METODOS_DIGITALES = ['qr', 'transferencia', 'tarjeta'];

export interface ResumenDia {
  fecha: string;
  ventasEfectivoSistema: number;
  ventasDigitalSistema: number;
  totalVentasSistema: number;
  yaCerrado: boolean;
  cierre: CierreCaja | null;
}

@Injectable()
export class CierreCajaService {
  constructor(
    @InjectRepository(CierreCaja)
    private readonly cierresRepository: Repository<CierreCaja>,

    @InjectRepository(Pago)
    private readonly pagosRepository: Repository<Pago>,
  ) {}

  async findAll(): Promise<CierreCaja[]> {
    return this.cierresRepository.find({ order: { fecha: 'DESC' } });
  }

  /**
   * Calcula, en base a los pagos aprobados, cuánto debería haber en caja
   * para una fecha dada. Se usa para mostrar el panel "Esperado en Sistema"
   * antes de registrar el cierre, y también internamente al momento de
   * crear el cierre (para no confiar en cifras enviadas por el cliente).
   */
  async resumenDia(fecha: string = hoyIso()): Promise<ResumenDia> {
    const pagosDelDia = await this.pagosRepository
      .createQueryBuilder('pago')
      .where('pago.estado = :estado', { estado: 'aprobado' })
      .andWhere('DATE(pago.fecha_pago) = :fecha', { fecha })
      .getMany();

    const ventasEfectivoSistema = this.sumarPorMetodo(
      pagosDelDia,
      (m) => m === 'efectivo',
    );
    const ventasDigitalSistema = this.sumarPorMetodo(pagosDelDia, (m) =>
      METODOS_DIGITALES.includes(m),
    );

    const cierre = await this.cierresRepository.findOneBy({ fecha });

    return {
      fecha,
      ventasEfectivoSistema,
      ventasDigitalSistema,
      totalVentasSistema: Number(
        (ventasEfectivoSistema + ventasDigitalSistema).toFixed(2),
      ),
      yaCerrado: Boolean(cierre),
      cierre,
    };
  }

  async create(
    idEmpleado: number,
    dto: CreateCierreCajaDto,
  ): Promise<CierreCaja> {
    const existente = await this.cierresRepository.findOneBy({
      fecha: dto.fecha,
    });
    if (existente) {
      throw new ConflictException(
        'Ya existe un cierre de caja registrado para esta fecha',
      );
    }

    // Las ventas del sistema SIEMPRE se recalculan en el servidor a partir
    // de los pagos aprobados; nunca se confía en un total enviado por el cliente.
    const { ventasEfectivoSistema, ventasDigitalSistema } =
      await this.resumenDia(dto.fecha);

    const totalEfectivoEsperado = dto.montoInicial + ventasEfectivoSistema;
    const diferencia = dto.efectivoContado - totalEfectivoEsperado;

    const cierre = this.cierresRepository.create({
      fecha: dto.fecha,
      idEmpleado,
      montoInicial: dto.montoInicial,
      efectivoContado: dto.efectivoContado,
      observaciones: dto.observaciones ?? null,
      ventasEfectivoSistema,
      ventasDigitalSistema,
      diferencia: Number(diferencia.toFixed(2)),
    });

    return this.cierresRepository.save(cierre);
  }

  private sumarPorMetodo(
    pagos: Pago[],
    predicado: (metodo: string) => boolean,
  ): number {
    const total = pagos
      .filter((p) => predicado((p.metodo || '').toLowerCase()))
      .reduce((acc, p) => acc + Number(p.monto), 0);
    return Number(total.toFixed(2));
  }
}
