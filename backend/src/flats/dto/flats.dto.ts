import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateFlatDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Flat name must be at least 3 characters long' })
  name: string;
}

export class JoinFlatDto {
  @IsString()
  @IsNotEmpty()
  joinCode: string;
}
