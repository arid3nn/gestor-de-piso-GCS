import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FlatMemberGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    // Attempt to extract flatId from route params or body
    const flatId = request.params.flatId || request.body.flatId || request.params.id;

    if (!user || !flatId) {
      return false; // Automatically deny if no flatId is resolvable or user is unauthenticated
    }

    const membership = await this.prisma.flatMember.findUnique({
      where: {
        userId_flatId: {
          userId: user.id,
          flatId: flatId,
        }
      }
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this flat.');
    }

    // Attach membership details for potential downstream use (e.g., role checks)
    request.flatMembership = membership;

    return true;
  }
}
