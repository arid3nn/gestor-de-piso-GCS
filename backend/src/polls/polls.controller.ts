import { Controller, Post, Body, Get, UseGuards, Request, Param } from '@nestjs/common';
import { PollsService } from './polls.service';
import { CreatePollDto, VoteDto } from './dto/polls.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FlatMemberGuard } from '../flats/guards/flat-member.guard';

@Controller('flats/:flatId/polls')
@UseGuards(JwtAuthGuard, FlatMemberGuard)
export class PollsController {
  constructor(private pollsService: PollsService) {}

  @Post()
  async createPoll(
    @Request() req: any,
    @Param('flatId') flatId: string,
    @Body() dto: CreatePollDto
  ) {
    return this.pollsService.createPoll(req.user.id, flatId, dto);
  }

  @Get()
  async getActivePolls(@Param('flatId') flatId: string) {
    return this.pollsService.getActivePolls(flatId);
  }

  @Post(':pollId/vote')
  async vote(
    @Request() req: any,
    @Param('flatId') flatId: string,
    @Param('pollId') pollId: string,
    @Body() dto: VoteDto
  ) {
    return this.pollsService.vote(req.user.id, flatId, pollId, dto);
  }
}
