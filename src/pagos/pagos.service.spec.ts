import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Pago } from './entities/pago.entity';
import { Pedido } from 'src/pedidos/entities/pedido.entity';
import { PagosService } from './pagos.service';

describe('PagosService', () => {
  let service: PagosService;
  let pagosRepository: {
    findOne: jest.Mock;
    save: jest.Mock;
    manager: { transaction: jest.Mock };
  };
  let transactionManager: { save: jest.Mock; update: jest.Mock };

  beforeEach(async () => {
    transactionManager = {
      save: jest.fn().mockImplementation(async (entity) => entity),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    pagosRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      manager: {
        transaction: jest.fn((callback) => callback(transactionManager)),
      },
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PagosService,
        { provide: getRepositoryToken(Pago), useValue: pagosRepository },
      ],
    }).compile();

    service = module.get<PagosService>(PagosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('cancels the related order when a payment is rejected', async () => {
    const pago = {
      id: 4,
      idPedido: 12,
      estado: 'en_revision',
      pedido: { id: 12, estado: 'pendiente' },
    };
    pagosRepository.findOne.mockResolvedValue(pago);

    await service.update(4, { estado: 'rechazado' });

    expect(pagosRepository.manager.transaction).toHaveBeenCalledTimes(1);
    expect(transactionManager.save).toHaveBeenCalledWith(pago);
    expect(transactionManager.update).toHaveBeenCalledWith(Pedido, 12, {
      estado: 'cancelado',
    });
    expect(pago.pedido.estado).toBe('cancelado');
  });
});
