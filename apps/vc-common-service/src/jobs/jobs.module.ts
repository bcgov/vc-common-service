import { Global, Module } from '@nestjs/common';

import { PgBossService } from '../../../../libs/pg-boss/src/pg-boss.service';

import { JobsService } from './jobs.service';

@Global()
@Module({
  providers: [PgBossService, JobsService],
  exports: [JobsService],
})
export class JobsModule {}
