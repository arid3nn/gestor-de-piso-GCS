import { Controller, Post, Body, Get, UseGuards, Request, Param } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto, CompleteTaskDto } from './dto/tasks.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FlatMemberGuard } from '../flats/guards/flat-member.guard';

@Controller('flats/:flatId/tasks')
@UseGuards(JwtAuthGuard, FlatMemberGuard)
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Post()
  async createTask(
    @Request() req: any,
    @Param('flatId') flatId: string,
    @Body() dto: CreateTaskDto
  ) {
    return this.tasksService.create(req.user.id, flatId, dto);
  }

  @Get()
  async getTasks(@Param('flatId') flatId: string) {
    return this.tasksService.getFlatTasks(flatId);
  }

  @Post('complete')
  async completeTask(
    @Request() req: any,
    @Param('flatId') flatId: string,
    @Body() dto: CompleteTaskDto
  ) {
    return this.tasksService.completeTask(req.user.id, flatId, dto);
  }
}
