import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PollsService } from './polls.service';
import { PollsController } from './polls.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { FlatsModule } from '../flats/flats.module';

import { PollsProcessor } from './polls.processor';

@Module({
  imports: [
    PrismaModule, 
    FlatsModule,
    // BullModule.registerQueue({
    //   name: 'polls', // The queue name matches the InjectQueue decorator
    // }),
  ],
  controllers: [PollsController],
  providers: [PollsService, PollsProcessor],
  exports: [PollsService],
})
export class PollsModule {}
