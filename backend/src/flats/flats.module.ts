import { Module } from '@nestjs/common';
import { FlatsService } from './flats.service';
import { FlatsController } from './flats.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FlatsController],
  providers: [FlatsService],
  exports: [FlatsService],
})
export class FlatsModule {}
