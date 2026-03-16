import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TasksService (Chore Rotation Algorithm)', () => {
  let service: TasksService;

  const mockPrismaService = {
    task: {
      findUnique: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
    flatMember: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should delete non-recurring tasks on completion', async () => {
    mockPrismaService.task.findUnique.mockResolvedValue({
      id: 'task-1',
      flatId: 'flat-1',
      frequency: 'ONCE',
    });

    await service.completeTask('user-1', 'flat-1', { taskId: 'task-1' });

    expect(mockPrismaService.task.delete).toHaveBeenCalledWith({
      where: { id: 'task-1' },
    });
  });

  it('should rotate assigned user for daily tasks', async () => {
    const today = new Date('2026-03-16T12:00:00Z');
    
    mockPrismaService.task.findUnique.mockResolvedValue({
      id: 'task-2',
      flatId: 'flat-1',
      frequency: 'DAILY',
      assignedToId: 'user-A',
      dueDate: today,
    });

    mockPrismaService.flatMember.findMany.mockResolvedValue([
      { userId: 'user-A' },
      { userId: 'user-B' },
      { userId: 'user-C' },
    ]);

    await service.completeTask('user-1', 'flat-1', { taskId: 'task-2' });

    expect(mockPrismaService.task.update).toHaveBeenCalled();
    const updateCallArg = mockPrismaService.task.update.mock.calls[0][0];

    // User A should rotate specifically to User B
    expect(updateCallArg.data.assignedToId).toBe('user-B');
    
    // Due date should increment by exactly 1 day for DAILY task
    const nextDueDate = updateCallArg.data.dueDate as Date;
    expect(nextDueDate.getUTCDate()).toBe(today.getUTCDate() + 1);
  });

  it('should loop array correctly back to beginning of members on rotation end', async () => {
    mockPrismaService.task.findUnique.mockResolvedValue({
      id: 'task-3',
      flatId: 'flat-1',
      frequency: 'WEEKLY',
      assignedToId: 'user-C', // Currently assigned to the LAST array object
      dueDate: new Date(),
    });

    mockPrismaService.flatMember.findMany.mockResolvedValue([
      { userId: 'user-A' },
      { userId: 'user-B' },
      { userId: 'user-C' },
    ]);

    await service.completeTask('user-1', 'flat-1', { taskId: 'task-3' });

    const updateCallArg = mockPrismaService.task.update.mock.calls[0][0];

    // User C should wrap around to User A
    expect(updateCallArg.data.assignedToId).toBe('user-A');
  });
});
