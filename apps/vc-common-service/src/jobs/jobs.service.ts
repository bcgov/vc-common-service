import { PgBossService } from '@app/pg-boss';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JobsService {
  public constructor(private readonly bossService: PgBossService) {}

  public publish(name: string, data: object | null) {
    return this.bossService.boss.send(name, data);
  }
}
