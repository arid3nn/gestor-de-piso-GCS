import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

export enum ExpenseCategory {
  GROCERIES = 'GROCERIES',
  UTILITIES = 'UTILITIES',
  RENT = 'RENT',
  CLEANING = 'CLEANING',
  OTHER = 'OTHER',
}

class SplitDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsNumber()
  amount: number;
}

export class CreateExpenseDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsNumber()
  amount: number;

  @IsEnum(ExpenseCategory)
  @IsOptional()
  category?: ExpenseCategory;

  @IsString()
  @IsOptional()
  receiptUrl?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SplitDto)
  splits: SplitDto[];
}
