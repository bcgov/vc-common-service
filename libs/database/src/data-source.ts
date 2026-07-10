// database/data-source.ts

import { DataSource } from 'typeorm';

import { InitialExtensions1783630501649 } from './migrations/000001_initial-extensions';
import { buildSslConfig } from './ssl.util';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: ['dist/**/*.entity.js'],
  migrations: [InitialExtensions1783630501649],
  ssl: buildSslConfig(
    process.env.DB_SSL,
    process.env.DB_SSL_REJECT_UNAUTHORIZED,
    process.env.DB_SSL_CA,
  ),
});
