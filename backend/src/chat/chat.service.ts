import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async getMessages(flatId: string) {
    return this.prisma.chatMessage.findMany({
      where: { flatId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } }
      },
      orderBy: { createdAt: 'asc' }
    });
  }

  async createMessage(userId: string, flatId: string, content: string) {
    return this.prisma.chatMessage.create({
      data: {
        flatId,
        userId,
        content
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } }
      }
    });
  }
}
