import { IsArray, IsDateString, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreatePollDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5, { message: 'Poll question must be at least 5 characters long' })
  question: string;

  @IsArray()
  @IsString({ each: true })
  @MinLength(1, { each: true, message: 'Options cannot be empty' })
  options: string[];

  @IsDateString()
  @IsNotEmpty()
  expiresAt: string;
}

export class VoteDto {
  @IsString()
  @IsNotEmpty()
  optionId: string;
}
