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
        expense: { flatId: flatId },
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
        expense: {
          select: {
            paidById: true,
            paidBy: { select: { id: true, firstName: true, lastName: true } },
          }
        }
      }
    });

    // 2. Map Net Balances for every user.
    const netBalances: Record<string, number> = {};
    const namesById: Record<string, { firstName: string; lastName: string }> = {};

    pendingSplits.forEach(split => {
      const debtorId = split.user?.id || split.userId;
      const creditorId = split.expense?.paidBy?.id || split.expense?.paidById;
      const amount = Number(split.amount);

      if (!netBalances[debtorId]) netBalances[debtorId] = 0;
      if (!netBalances[creditorId]) netBalances[creditorId] = 0;

      netBalances[debtorId] -= amount;
      netBalances[creditorId] += amount;

      if (split.user) {
        namesById[debtorId] = {
          firstName: split.user.firstName,
          lastName: split.user.lastName,
        };
      }
      if (split.expense?.paidBy) {
        namesById[creditorId] = {
          firstName: split.expense.paidBy.firstName,
          lastName: split.expense.paidBy.lastName,
        };
      }
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
        fromName: `${namesById[debtor.id]?.firstName || 'Usuario'} ${namesById[debtor.id]?.lastName || ''}`.trim(),
        toName: `${namesById[creditor.id]?.firstName || 'Usuario'} ${namesById[creditor.id]?.lastName || ''}`.trim(),
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

  async payDebt(userId: string, flatId: string, dto: { fromUserId: string; toUserId: string; amount: number }) {
    const fromUser = await this.prisma.user.findUnique({ where: { id: dto.fromUserId } });
    const toUser = await this.prisma.user.findUnique({ where: { id: dto.toUserId } });
    if (!fromUser || !toUser) {
      throw new BadRequestException('User not found');
    }
    const fromName = fromUser.firstName;
    const toName = toUser.firstName;

    return this.createExpense(dto.fromUserId, flatId, {
      title: `Pago de deuda: ${fromName} a ${toName}`,
      amount: dto.amount,
      category: 'OTHER' as any,
      splits: [
        { userId: dto.toUserId, amount: dto.amount }
      ]
    });
  }
}
