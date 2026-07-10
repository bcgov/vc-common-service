import { Injectable } from '@nestjs/common';

import { PgBossService } from '../../../../libs/pg-boss/src/pg-boss.service';

@Injectable()
export class JobsService {
  public constructor(private readonly bossService: PgBossService) {}

  public async publish(name: string, data: object | null) {
    return this.bossService.boss.send(name, data);
  }
}
