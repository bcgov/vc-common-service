import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USERNAME', 'postgres'),
        password: config.get<string>('DB_PASSWORD', 'postgres'),
        database: config.get<string>('DB_NAME', 'vc_common_service'),
        autoLoadEntities: true,
        synchronize: config.get<string>('NODE_ENV') !== 'production',
        logging: config.get<string>('DB_LOGGING') === 'true',
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
