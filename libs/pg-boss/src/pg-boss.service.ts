import { buildSslConfig } from '@app/database/ssl.util';
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PgBoss } from 'pg-boss';

@Injectable()
export class PgBossService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PgBossService.name);

  public readonly boss: PgBoss;

  public constructor(config: ConfigService) {
    this.boss = new PgBoss({
      host: config.get<string>('DB_HOST', 'localhost'),
      port: parseInt(config.get<string>('DB_PORT', '5432'), 10),
      database: config.getOrThrow<string>('DB_NAME'),
      user: config.getOrThrow<string>('DB_USERNAME'),
      password: config.getOrThrow<string>('DB_PASSWORD'),
      ssl: buildSslConfig(
        config.get<string>('DB_SSL'),
        config.get<string>('DB_SSL_REJECT_UNAUTHORIZED'),
        config.get<string>('DB_SSL_CA'),
      ),
    });
  }

  public async onModuleInit() {
    this.logger.log('Starting pg-boss...');
    await this.boss.start();
    this.logger.log('pg-boss started');
  }

  public async onModuleDestroy() {
    this.logger.log('Stopping pg-boss...');
    await this.boss.stop();
  }
}
