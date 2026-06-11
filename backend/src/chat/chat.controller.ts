import { Controller, Post, Body, Get, UseGuards, Request, Param } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FlatMemberGuard } from '../flats/guards/flat-member.guard';

@Controller('flats/:flatId/messages')
@UseGuards(JwtAuthGuard, FlatMemberGuard)
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Get()
  async getMessages(@Param('flatId') flatId: string) {
    return this.chatService.getMessages(flatId);
  }

  @Post()
  async createMessage(
    @Request() req: any,
    @Param('flatId') flatId: string,
    @Body() dto: { content: string }
  ) {
    return this.chatService.createMessage(req.user.id, flatId, dto.content);
  }
}
