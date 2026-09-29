import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Configuracion,
  METODOS_PAGO_POR_DEFECTO,
} from './entities/configuracion.entity';
import { UpdateConfiguracionDto } from './dto/update-configuracion.dto';

const ID_CONFIGURACION = 1;

@Injectable()
export class ConfiguracionService {
  constructor(
    @InjectRepository(Configuracion)
    private readonly configuracionRepository: Repository<Configuracion>,
  ) {}

  async obtener(): Promise<Configuracion> {
    let configuracion = await this.configuracionRepository.findOneBy({
      id: ID_CONFIGURACION,
    });

    // Si es la primera vez que se accede, se crea la fila con valores por defecto
    if (!configuracion) {
      configuracion = this.configuracionRepository.create({
        id: ID_CONFIGURACION,
        metodosPago: METODOS_PAGO_POR_DEFECTO,
      });
      configuracion = await this.configuracionRepository.save(configuracion);
    }

    return configuracion;
  }

  async actualizar(dto: UpdateConfiguracionDto): Promise<Configuracion> {
    const configuracion = await this.obtener();

    Object.assign(configuracion, {
      ...dto,
      // Merge por método para conservar los campos no enviados.
      metodosPago: dto.metodosPago
        ? {
            ...configuracion.metodosPago,
            ...dto.metodosPago,
            qr: { ...configuracion.metodosPago.qr, ...dto.metodosPago.qr },
            transferencia: {
              ...configuracion.metodosPago.transferencia,
              ...dto.metodosPago.transferencia,
            },
            efectivo: {
              ...configuracion.metodosPago.efectivo,
              ...dto.metodosPago.efectivo,
            },
          }
        : configuracion.metodosPago,
    });

    return this.configuracionRepository.save(configuracion);
  }
}
