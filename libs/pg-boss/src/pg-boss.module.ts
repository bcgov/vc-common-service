import { Global, Module } from '@nestjs/common';

import { PG_BOSS } from './pg-boss.constants';
import { PgBossService } from './pg-boss.service';

@Global()
@Module({
  providers: [
    PgBossService,
    {
      provide: PG_BOSS,
      useFactory: (service: PgBossService) => service.boss,
      inject: [PgBossService],
    },
  ],
  exports: [PG_BOSS],
})
export class PgBossModule {}
