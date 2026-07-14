import { PgBossModule } from '@app/pg-boss';
import { Global, Module } from '@nestjs/common';

import { JobsService } from './jobs.service';

@Global()
@Module({
  imports: [PgBossModule],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
