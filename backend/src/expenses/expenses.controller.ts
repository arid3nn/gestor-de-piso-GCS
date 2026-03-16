import { Controller, Post, Body, Get, UseGuards, Request, Param } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/expenses.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FlatMemberGuard } from '../flats/guards/flat-member.guard';

@Controller('flats/:flatId/expenses')
@UseGuards(JwtAuthGuard, FlatMemberGuard)
export class ExpensesController {
  constructor(private expensesService: ExpensesService) {}

  @Post()
  async createExpense(
    @Request() req: any,
    @Param('flatId') flatId: string,
    @Body() dto: CreateExpenseDto
  ) {
    return this.expensesService.createExpense(req.user.id, flatId, dto);
  }

  @Get()
  async getExpenses(@Param('flatId') flatId: string) {
    // Returns full ledger history for this flat MVP
    return this.expensesService.getExpenses(flatId);
  }

  @Get('balances')
  async getBalances(@Param('flatId') flatId: string) {
    // Returns the calculated and simplified debt graph mapping who owes whom
    return this.expensesService.getBalances(flatId);
  }
}
