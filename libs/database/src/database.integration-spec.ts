import { DataSource } from 'typeorm';

import { InitialExtensions1783630501649 } from './migrations/000001_initial-extensions';
import { buildSslConfig } from './ssl.util';

// Exercises a real PostgreSQL connection: applies the migrations and performs
// read/write round-trips. Requires a running database (see jest-integration-setup.ts).
describe('database integration', () => {
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [],
      migrations: [InitialExtensions1783630501649],
      ssl: buildSslConfig(
        process.env.DB_SSL,
        process.env.DB_SSL_REJECT_UNAUTHORIZED,
        process.env.DB_SSL_CA,
      ),
    });

    await dataSource.initialize();
    await dataSource.runMigrations();
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
  });

  it('connects to the database and reports a live server version', async () => {
    const [{ version }] =
      await dataSource.query<[{ version: string }]>('SELECT version()');

    expect(version).toContain('PostgreSQL');
  });

  it('applies the initial migration and installs the required extensions', async () => {
    const rows = await dataSource.query<Array<{ extname: string }>>(
      `SELECT extname FROM pg_extension WHERE extname IN ('uuid-ossp', 'pgcrypto')`,
    );

    const extensions = rows.map((row) => row.extname).sort();
    expect(extensions).toEqual(['pgcrypto', 'uuid-ossp']);
  });

  it('performs a write/read round-trip using the migrated extensions', async () => {
    const tableName = `it_roundtrip_${Date.now()}`;

    await dataSource.query(
      `CREATE TABLE "${tableName}" (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        digest text NOT NULL DEFAULT encode(gen_random_bytes(8), 'hex'),
        label text NOT NULL
      )`,
    );

    try {
      await dataSource.query(`INSERT INTO "${tableName}" (label) VALUES ($1)`, [
        'integration-fixture',
      ]);

      const rows = await dataSource.query<
        Array<{ id: string; digest: string; label: string }>
      >(`SELECT id, digest, label FROM "${tableName}"`);

      expect(rows).toHaveLength(1);
      expect(rows[0].label).toBe('integration-fixture');
      expect(rows[0].id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
      expect(rows[0].digest).toMatch(/^[0-9a-f]{16}$/);
    } finally {
      await dataSource.query(`DROP TABLE IF EXISTS "${tableName}"`);
    }
  });
});
