import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PollsService } from './polls.service';

@Processor('polls')
export class PollsProcessor extends WorkerHost {
  constructor(private readonly pollsService: PollsService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case 'closePoll':
        console.log(`Executing closePoll job for Poll ID: ${job.data.pollId}`);
        await this.pollsService.finalizePoll(job.data.pollId);
        
        // MVP Realtime Hook: We would normally inject EventsGateway here to emit
        // a "pollClosed" event to the flat room so mobile clients update instantly.
        
        return { success: true };
      
      default:
        console.log(`Unknown job type: ${job.name}`);
    }
  }
}
