import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto, CompleteTaskDto } from './dto/tasks.dto';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, flatId: string, dto: CreateTaskDto) {
    return this.prisma.task.create({
      data: {
        flatId,
        title: dto.title,
        description: dto.description,
        frequency: dto.frequency || 'ONCE',
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        createdById: userId,
        assignedToId: dto.assignedToId,
      },
    });
  }

  async getFlatTasks(flatId: string) {
    return this.prisma.task.findMany({
      where: { flatId },
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        createdBy: { select: { id: true, firstName: true } }
      },
      orderBy: { dueDate: 'asc' }
    });
  }

  async completeTask(userId: string, flatId: string, dto: CompleteTaskDto) {
    const task = await this.prisma.task.findUnique({
      where: { id: dto.taskId, flatId }
    });

    if (!task) {
      throw new NotFoundException('Task not found in this flat.');
    }

    if (task.frequency === 'ONCE') {
      // For non-recurring tasks, simply delete or mark done. We will delete for MVP simplicity as requested.
      return this.prisma.task.delete({
        where: { id: task.id }
      });
    }

    // --- RECURRING CHORE ROTATION ALGORITHM MVP ---
    // If it's recurring, calculate the next person in the flat and update dueDate.
    const flatMembers = await this.prisma.flatMember.findMany({
      where: { flatId, leftAt: null },
      orderBy: { joinedAt: 'asc' }, // Predictable ordering
      select: { userId: true }
    });

    if (flatMembers.length === 0) return; // Should not happen, but safety first

    let nextAssigneeId = flatMembers[0].userId; // Default to first person

    if (task.assignedToId) {
      const currentIndex = flatMembers.findIndex(m => m.userId === task.assignedToId);
      if (currentIndex !== -1) {
        // Rotate to next person, loop back to start if at end
        const nextIndex = (currentIndex + 1) % flatMembers.length;
        nextAssigneeId = flatMembers[nextIndex].userId;
      }
    }

    // Calculate next due date
    let nextDueDate = task.dueDate ? new Date(task.dueDate) : new Date();
    if (task.frequency === 'DAILY') nextDueDate.setDate(nextDueDate.getDate() + 1);
    else if (task.frequency === 'WEEKLY') nextDueDate.setDate(nextDueDate.getDate() + 7);
    else if (task.frequency === 'MONTHLY') nextDueDate.setMonth(nextDueDate.getMonth() + 1);

    return this.prisma.task.update({
      where: { id: task.id },
      data: {
        assignedToId: nextAssigneeId,
        dueDate: nextDueDate,
        lastCompleted: new Date(),
      }
    });
  }
}
