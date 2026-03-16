import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFlatDto, JoinFlatDto } from './dto/flats.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class FlatsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateFlatDto) {
    // Generate a 6-character alphanumeric join code
    const joinCode = randomBytes(3).toString('hex').toUpperCase();

    // Create the flat and add the creator as an ADMIN member in a single transaction
    const flat = await this.prisma.flat.create({
      data: {
        name: dto.name,
        joinCode: joinCode,
        members: {
          create: {
            userId: userId,
            role: 'ADMIN',
          }
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true }
            }
          }
        }
      }
    });

    return flat;
  }

  async join(userId: string, dto: JoinFlatDto) {
    const flat = await this.prisma.flat.findUnique({
      where: { joinCode: dto.joinCode }
    });

    if (!flat) {
      throw new NotFoundException('Invalid join code');
    }

    const existingMember = await this.prisma.flatMember.findUnique({
      where: {
        userId_flatId: {
          userId: userId,
          flatId: flat.id,
        }
      }
    });

    if (existingMember) {
      throw new ConflictException('You are already a member of this flat');
    }

    const newMember = await this.prisma.flatMember.create({
      data: {
        userId: userId,
        flatId: flat.id,
        role: 'MEMBER', // Default role is member
      },
      include: {
        flat: true
      }
    });

    return newMember;
  }

  async getMyFlats(userId: string) {
    return this.prisma.flatMember.findMany({
      where: { userId },
      include: {
        flat: {
          include: {
            _count: {
              select: { members: true }
            }
          }
        }
      }
    });
  }

  async getFlatDetails(userId: string, flatId: string) {
    const member = await this.prisma.flatMember.findUnique({
      where: { userId_flatId: { userId, flatId } }
    });

    if (!member) {
      throw new NotFoundException('You are not a member of this flat');
    }

    return this.prisma.flat.findUnique({
      where: { id: flatId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true }
            }
          }
        },
        rooms: true,
      }
    });
  }
}
