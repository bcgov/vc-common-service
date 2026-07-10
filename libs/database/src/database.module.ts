import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { buildSslConfig } from './ssl.util';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get<string>('DB_HOST', 'localhost'),
        port: parseInt(config.get<string>('DB_PORT', '5432'), 10),
        username: config.getOrThrow<string>('DB_USERNAME'),
        password: config.getOrThrow<string>('DB_PASSWORD'),
        database: config.getOrThrow<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: false,
        migrationsRun: false,
        logging: config.get<string>('DB_LOGGING') === 'true',
        ssl: buildSslConfig(
          config.get<string>('DB_SSL'),
          config.get<string>('DB_SSL_REJECT_UNAUTHORIZED'),
          config.get<string>('DB_SSL_CA'),
        ),
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
