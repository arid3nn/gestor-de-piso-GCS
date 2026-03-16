import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum TaskFrequency {
  ONCE = 'ONCE',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TaskFrequency)
  @IsOptional()
  frequency?: TaskFrequency;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsString()
  @IsOptional()
  assignedToId?: string;
}

export class CompleteTaskDto {
  @IsString()
  @IsNotEmpty()
  taskId: string;
}
