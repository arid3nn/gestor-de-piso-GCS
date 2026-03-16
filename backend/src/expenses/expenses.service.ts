import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto } from './dto/expenses.dto';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  async createExpense(userId: string, flatId: string, dto: CreateExpenseDto) {
    // 1. Validate total splits equal total expense amount to maintain Ledger Integrity
    const totalSplits = dto.splits.reduce((sum, split) => sum + split.amount, 0);
    // Allow for minor floating point diffs or require exact precision
    if (Math.abs(totalSplits - dto.amount) > 0.01) {
      throw new BadRequestException('Split amounts must exactly equal the total expense amount.');
    }

    // 2. Wrap creation in a Prisma transaction for Atomicity
    const expense = await this.prisma.$transaction(async (tx) => {
      const newExp = await tx.expense.create({
        data: {
          title: dto.title,
          amount: dto.amount,
          category: dto.category || 'OTHER',
          receiptUrl: dto.receiptUrl,
          flatId: flatId,
          paidById: userId,
        }
      });

      // Create all splits
      const splitPromises = dto.splits.map(split => {
        // Person who paid already "paid" their own split. Others correspond to debt.
        const status = split.userId === userId ? 'PAID' : 'PENDING';
        const paidAt = split.userId === userId ? new Date() : null;

        return tx.expenseSplit.create({
          data: {
            expenseId: newExp.id,
            userId: split.userId,
            amount: split.amount,
            status: status,
            paidAt: paidAt
          }
        });
      });

      await Promise.all(splitPromises);

      return newExp;
    });

    return expense;
  }

  async getBalances(flatId: string) {
    // This is the core Debt Liquidation algorithm data fetching.
    // 1. Get all pending splits in this flat
    const pendingSplits = await this.prisma.expenseSplit.findMany({
      where: {
        status: 'PENDING',
        expense: { flatId: flatId }
      },
      include: {
        expense: { select: { paidById: true } }
      }
    });

    // 2. Map Net Balances for every user.
    const netBalances: Record<string, number> = {};

    pendingSplits.forEach(split => {
      const debtor = split.userId;
      const creditor = split.expense.paidById;
      const amount = Number(split.amount);

      if (!netBalances[debtor]) netBalances[debtor] = 0;
      if (!netBalances[creditor]) netBalances[creditor] = 0;

      netBalances[debtor] -= amount; // Debtors lose net balance
      netBalances[creditor] += amount; // Creditors gain net balance
    });

    // 3. Simple Greedy Graph Simplification (Debt Liquidation MVP)
    // Separate into debtors (negative) and creditors (positive)
    interface PersonBalance { id: string; amount: number; }
    
    const debtors: PersonBalance[] = [];
    const creditors: PersonBalance[] = [];

    for (const [id, amount] of Object.entries(netBalances)) {
      if (amount < -0.01) debtors.push({ id, amount: Math.abs(amount) });
      else if (amount > 0.01) creditors.push({ id, amount });
    }

    // Sort to optimize greedy matching
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const simplifiedDebts = [];
    let i = 0; // index for debtors
    let j = 0; // index for creditors

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      
      const settledAmount = Math.min(debtor.amount, creditor.amount);
      
      simplifiedDebts.push({
        from: debtor.id,
        to: creditor.id,
        amount: Number(settledAmount.toFixed(2))
      });

      debtor.amount -= settledAmount;
      creditor.amount -= settledAmount;

      if (debtor.amount < 0.01) i++;
      if (creditor.amount < 0.01) j++;
    }

    return simplifiedDebts;
  }

  async getExpenses(flatId: string) {
    return this.prisma.expense.findMany({
      where: { flatId },
      include: {
        paidBy: { select: { id: true, firstName: true } },
        splits: {
          include: {
            user: { select: { id: true, firstName: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}
