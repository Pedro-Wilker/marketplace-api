import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { mockDb } from '../../test/mocks/drizzle.mock';
import { NotFoundException } from '@nestjs/common';

describe('ProductsService', () => {
  let service: ProductsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: 'DRIZZLE', useValue: mockDb },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    jest.clearAllMocks(); // ← MUDOU: vi para jest
  });

  describe('findAll', () => {
    it('should return products without filters', async () => {
      const mockProducts = [{ id: '1', name: 'Produto A' }];
      mockDb.select.mockReturnThis();
      mockDb.from.mockResolvedValue(mockProducts);

      const result = await service.findAll();

      expect(result).toEqual(mockProducts);
    });

    it('should filter by merchantId', async () => {
      const mockProducts = [{ id: '1', merchantId: 'm1' }];
      mockDb.select.mockReturnThis();
      mockDb.from.mockReturnThis();
      mockDb.where.mockResolvedValue(mockProducts);

      const result = await service.findAll({ merchantId: 'm1' });

      expect(result).toEqual(mockProducts);
    });
  });

  describe('create', () => {
    it('should create product', async () => {
      const mockInput = { 
        name: 'Produto Teste', 
        price: '99.99', // ← MUDOU: de number para string
        merchantId: 'm1' 
      };
      const mockCreated = { id: 'p1', ...mockInput };
      mockDb.insert.mockReturnThis();
      mockDb.values.mockReturnThis();
      mockDb.returning.mockResolvedValue([mockCreated]);

      const result = await service.create(mockInput);

      expect(result).toEqual(mockCreated);
    });
  });
});