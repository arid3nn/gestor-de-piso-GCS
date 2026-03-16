import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EventsModule } from './events/events.module';
import { FlatsModule } from './flats/flats.module';
import { TasksModule } from './tasks/tasks.module';
import { ExpensesModule } from './expenses/expenses.module';
import { PollsModule } from './polls/polls.module';

import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    EventsModule,
    FlatsModule,
    TasksModule,
    ExpensesModule,
    PollsModule,
    // BullModule.forRoot({
    //   connection: {
    //     host: process.env.REDIS_HOST || 'localhost',
    //     port: parseInt(process.env.REDIS_PORT || '6379', 10),
    //   },
    // }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
