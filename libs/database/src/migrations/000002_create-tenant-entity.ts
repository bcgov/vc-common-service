import { MigrationInterface, QueryRunner } from 'typeorm';

export const migrationName = 'CreateTenantEntity';

export class CreateTenantEntity1784231917556 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE tenant_status AS ENUM (
        'active',
        'suspended',
        'deactivated'
      );
    `);

    await queryRunner.query(`
      CREATE TABLE tenants (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          slug VARCHAR(100) NOT NULL,
          description TEXT,
          status tenant_status NOT NULL DEFAULT 'active',
          config JSONB NOT NULL DEFAULT '{}'::jsonb,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          deleted_at TIMESTAMP WITH TIME ZONE
      );
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_tenants_slug ON tenants (slug) WHERE deleted_at IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX idx_tenants_status ON tenants (status) WHERE deleted_at IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE tenants;
    `);

    await queryRunner.query(`
      DROP TYPE tenant_status;
    `);
  }
}
