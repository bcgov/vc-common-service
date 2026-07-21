import { MigrationInterface, QueryRunner } from 'typeorm';

export const migrationName = 'CreateTenantUserEntity';

export class CreateTenantUserEntity1784241747468 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enum types for tenant_user table
    await queryRunner.query(`
      CREATE TYPE tenant_user_role AS ENUM (
        'owner',
        'admin',
        'member',
        'readonly'
      );
    `);
    await queryRunner.query(`
      CREATE TYPE tenant_user_status AS ENUM (
          'active',
          'invited',
          'disabled'
      );
    `);

    // Create tenant_user table
    await queryRunner.query(`
      CREATE TABLE tenant_user (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

          tenant_id UUID NOT NULL,

          external_user_id VARCHAR(255) NOT NULL, -- Keycloak sub
          email VARCHAR(255) NOT NULL,
          display_name VARCHAR(255),

          role tenant_user_role NOT NULL DEFAULT 'member',
          status tenant_user_status NOT NULL DEFAULT 'invited',

          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

          CONSTRAINT fk_tenant_user_tenant
              FOREIGN KEY (tenant_id)
              REFERENCES tenant(id)
              ON DELETE CASCADE,

          CONSTRAINT uq_tenant_user_external_user
              UNIQUE (tenant_id, external_user_id)
      );
    `);

    // Create indexes for tenant_user table
    await queryRunner.query(`
      CREATE INDEX idx_tenant_user_tenant_id ON tenant_user (tenant_id);
    `);
    await queryRunner.query(`
      CREATE INDEX idx_tenant_user_external_user_id ON tenant_user (external_user_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tenant_user table
    await queryRunner.query(`
      DROP TABLE tenant_user;
    `);

    // Drop enum types for tenant_user table
    await queryRunner.query(`
      DROP TYPE tenant_user_role;
    `);
    await queryRunner.query(`
      DROP TYPE tenant_user_status;
    `);
  }
}
