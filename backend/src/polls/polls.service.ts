import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePollDto, VoteDto } from './dto/polls.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class PollsService {
  constructor(
    private prisma: PrismaService,
    // @InjectQueue('polls') private pollsQueue: Queue
  ) {}

  async createPoll(userId: string, flatId: string, dto: CreatePollDto) {
    if (dto.options.length < 2) {
      throw new BadRequestException('A poll must have at least two options.');
    }

    const expiryDate = new Date(dto.expiresAt);
    if (expiryDate <= new Date()) {
      throw new BadRequestException('Expiration date must be in the future.');
    }

    const poll = await this.prisma.poll.create({
      data: {
        flatId: flatId,
        question: dto.question,
        expiresAt: expiryDate,
        createdById: userId,
        options: {
          create: dto.options.map(opt => ({ text: opt }))
        }
      },
      include: { options: true }
    });

    // Schedule background job to close this poll exactly at expiresAt
    const delay = expiryDate.getTime() - Date.now();
    // await this.pollsQueue.add(
    //   'closePoll',
    //   { pollId: poll.id, flatId: flatId },
    //   { delay: delay }
    // );

    return poll;
  }

  async getActivePolls(flatId: string) {
    return this.prisma.poll.findMany({
      where: { flatId, isClosed: false },
      include: {
        options: {
          include: {
            _count: { select: { votes: true } }
          }
        },
        createdBy: { select: { id: true, firstName: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async vote(userId: string, flatId: string, pollId: string, dto: VoteDto) {
    const poll = await this.prisma.poll.findUnique({
      where: { id: pollId, flatId },
      include: { options: true }
    });

    if (!poll) throw new NotFoundException('Poll not found');
    if (poll.isClosed || new Date() > poll.expiresAt) {
      throw new BadRequestException('This poll is closed.');
    }

    const optionExists = poll.options.some(o => o.id === dto.optionId);
    if (!optionExists) throw new NotFoundException('Option not found in this poll.');

    // Enforce 1 vote per user per poll
    const existingVote = await this.prisma.vote.findFirst({
      where: { 
        userId: userId,
        pollOption: { pollId: pollId } // Check if they voted for any option in this poll
      }
    });

    if (existingVote) {
      throw new ConflictException('You have already voted in this poll.');
    }

    return this.prisma.vote.create({
      data: {
        userId: userId,
        pollOptionId: dto.optionId,
      }
    });
  }

  // Called by the BullMQ worker
  async finalizePoll(pollId: string) {
    return this.prisma.poll.update({
      where: { id: pollId },
      data: { isClosed: true }
    });
  }
}
