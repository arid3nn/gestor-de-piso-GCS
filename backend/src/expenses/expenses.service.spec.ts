import { Test, TestingModule } from '@nestjs/testing';
import { ExpensesService } from './expenses.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ExpensesService (Debt Liquidation Algorithm)', () => {
  let service: ExpensesService;

  // Mock PrismaService
  const mockPrismaService = {
    expenseSplit: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(mockPrismaService)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpensesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ExpensesService>(ExpensesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should simplify complex A->B->C linear debt into A->C', async () => {
    // A owes B $10. B owes C $10.
    // Optimal output: A owes C $10.
    mockPrismaService.expenseSplit.findMany.mockResolvedValue([
      { userId: 'A', amount: 10, status: 'PENDING', expense: { paidById: 'B' } },
      { userId: 'B', amount: 10, status: 'PENDING', expense: { paidById: 'C' } },
    ]);

    const result = await service.getBalances('flat-123');

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ from: 'A', to: 'C', amount: 10 });
  });

  it('should simplify overlapping circular debt A->B, B->C, C->A into no debt', async () => {
    // A owes B 10. B owes C 10. C owes A 10.
    // Optimal output: No debt.
    mockPrismaService.expenseSplit.findMany.mockResolvedValue([
      { userId: 'A', amount: 10, status: 'PENDING', expense: { paidById: 'B' } },
      { userId: 'B', amount: 10, status: 'PENDING', expense: { paidById: 'C' } },
      { userId: 'C', amount: 10, status: 'PENDING', expense: { paidById: 'A' } },
    ]);

    const result = await service.getBalances('flat-123');

    expect(result).toHaveLength(0);
  });

  it('should handle many-to-one centralized spending', async () => {
    // A owes C 50. B owes C 20.
    // Output: A->C 50, B->C 20.
    mockPrismaService.expenseSplit.findMany.mockResolvedValue([
      { userId: 'A', amount: 50, status: 'PENDING', expense: { paidById: 'C' } },
      { userId: 'B', amount: 20, status: 'PENDING', expense: { paidById: 'C' } },
    ]);

    const result = await service.getBalances('flat-123');

    // Due to greedy sorting, B->C might evaluate before A->C depending on code logic, 
    // but the final sums mapped to the individuals must be identical.
    expect(result.length).toBe(2);
    expect(result.find(r => r.from === 'A')?.to).toBe('C');
    expect(result.find(r => r.from === 'A')?.amount).toBe(50);
    expect(result.find(r => r.from === 'B')?.to).toBe('C');
    expect(result.find(r => r.from === 'B')?.amount).toBe(20);
  });
});
