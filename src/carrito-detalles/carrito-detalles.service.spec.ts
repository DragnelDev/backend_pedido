import { Test, TestingModule } from '@nestjs/testing';
import { CarritoDetallesService } from './carrito-detalles.service';

describe('CarritoDetallesService', () => {
  let service: CarritoDetallesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CarritoDetallesService],
    }).compile();

    service = module.get<CarritoDetallesService>(CarritoDetallesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
