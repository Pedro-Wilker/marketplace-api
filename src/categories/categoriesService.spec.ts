import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { mockDb } from '../../test/mocks/drizzle.mock';

describe('CategoriesService', () => {
  let service: CategoriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: 'DRIZZLE', useValue: mockDb },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    jest.clearAllMocks(); // ← MUDOU: vi para jest
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all categories', async () => {
      const mockCategories = [{ id: '1', name: 'Eletrônicos' }];
      mockDb.select.mockReturnThis();
      mockDb.from.mockResolvedValue(mockCategories);

      const result = await service.findAll();

      expect(result).toEqual(mockCategories);
    });
  });

  describe('create', () => {
    it('should create category', async () => {
      const mockInput = { name: 'Roupas', type: 'product' as const }; // ← BÔNUS: adicionei "as const"
      const mockCreated = { id: '2', ...mockInput };
      mockDb.insert.mockReturnThis();
      mockDb.values.mockReturnThis();
      mockDb.returning.mockResolvedValue([mockCreated]);

      const result = await service.create(mockInput);

      expect(result).toEqual(mockCreated);
    });
  });
});