import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';

const mockDb = {
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  offset: jest.fn().mockReturnThis(),
  returning: jest.fn(),
  values: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: 'DRIZZLE', useValue: mockDb },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and return new user', async () => {
      const mockInput = {
        name: 'New User',
        email: 'new@email.com',
        type: 'customer' as const, 
      };

      const mockCreated = { id: '2', ...mockInput };

      mockDb.insert.mockReturnThis();
      mockDb.values.mockReturnThis();
      mockDb.returning.mockResolvedValue([mockCreated]);

      const result = await service.create(mockInput);

      expect(result).toEqual(mockCreated);
      expect(mockDb.insert).toHaveBeenCalledWith(mockInput);
    });
  });
});