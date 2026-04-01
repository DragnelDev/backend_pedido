import { Test, TestingModule } from '@nestjs/testing';
import { CarritoDetallesController } from './carrito-detalles.controller';
import { CarritoDetallesService } from './carrito-detalles.service';

describe('CarritoDetallesController', () => {
  let controller: CarritoDetallesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CarritoDetallesController],
      providers: [CarritoDetallesService],
    }).compile();

    controller = module.get<CarritoDetallesController>(
      CarritoDetallesController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
