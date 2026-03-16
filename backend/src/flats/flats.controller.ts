import { Controller, Post, Body, Get, UseGuards, Request, Param } from '@nestjs/common';
import { FlatsService } from './flats.service';
import { CreateFlatDto, JoinFlatDto } from './dto/flats.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('flats')
@UseGuards(JwtAuthGuard)
export class FlatsController {
  constructor(private flatsService: FlatsService) {}

  @Post('create')
  async createFlat(@Request() req: any, @Body() dto: CreateFlatDto) {
    return this.flatsService.create(req.user.id, dto);
  }

  @Post('join')
  async joinFlat(@Request() req: any, @Body() dto: JoinFlatDto) {
    return this.flatsService.join(req.user.id, dto);
  }

  @Get()
  async getMyFlats(@Request() req: any) {
    return this.flatsService.getMyFlats(req.user.id);
  }

  @Get(':id')
  async getFlatDetails(@Request() req: any, @Param('id') id: string) {
    return this.flatsService.getFlatDetails(req.user.id, id);
  }
}
