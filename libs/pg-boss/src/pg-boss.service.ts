import { buildSslConfig } from '@app/database/ssl.util';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { PgBoss } from 'pg-boss';

@Injectable()
export class PgBossService {
  private readonly logger = new Logger(PgBossService.name);

  public boss!: PgBoss;

  public constructor(private readonly config: ConfigService) {}

  public async createBoss(): Promise<PgBoss> {
    const { PgBoss } = await import('pg-boss');

    return new PgBoss({
      host: this.config.get<string>('DB_HOST', 'localhost'),
      port: parseInt(this.config.get<string>('DB_PORT', '5432'), 10),
      database: this.config.getOrThrow<string>('DB_NAME'),
      user: this.config.getOrThrow<string>('DB_USERNAME'),
      password: this.config.getOrThrow<string>('DB_PASSWORD'),
      ssl: buildSslConfig(
        this.config.get<string>('DB_SSL'),
        this.config.get<string>('DB_SSL_REJECT_UNAUTHORIZED'),
        this.config.get<string>('DB_SSL_CA'),
      ),
    });
  }

  public async initializeBoss(): Promise<PgBoss> {
    const boss = await this.createBoss();
    this.boss = boss;
    this.logger.log('Starting pg-boss...');
    await boss.start();
    this.logger.log('pg-boss started');
    return boss;
  }
}
