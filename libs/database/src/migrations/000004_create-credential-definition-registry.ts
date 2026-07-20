import { MigrationInterface, QueryRunner } from 'typeorm';

export const migrationName = 'CreateCredentialDefinitionRegistry';

export class CreateCredentialDefinitionRegistry1784316680145 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE credential_definition_format AS ENUM (
        'anoncreds',
        'sd-jwt',
        'mdl',
        'w3c-vc'
      );
    `);

    await queryRunner.query(`
      CREATE TYPE credential_definition_connector_type AS ENUM (
        'traction',
        'credo'
      );
    `);

    await queryRunner.query(`
      CREATE TABLE credential_definition (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        name VARCHAR(255) NOT NULL,
        format credential_definition_format NOT NULL,
        schema_definition JSONB NOT NULL,
        external_id VARCHAR(255) NOT NULL,
        connector_type credential_definition_connector_type NOT NULL,
        metadata JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

        CONSTRAINT fk_credential_definition_tenant
          FOREIGN KEY (tenant_id)
          REFERENCES tenant(id)
          ON DELETE CASCADE,

        CONSTRAINT uq_credential_definition_tenant_name_format
          UNIQUE (tenant_id, name, format)
      );
    `);

    await queryRunner.query(`
      CREATE INDEX idx_credential_definition_tenant_id
      ON credential_definition (tenant_id);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_credential_definition_format
      ON credential_definition (format);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_credential_definition_tenant_connector
      ON credential_definition (tenant_id, connector_type);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_credential_definition_external_id
      ON credential_definition (external_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_credential_definition_external_id;
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_credential_definition_tenant_connector;
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_credential_definition_format;
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_credential_definition_tenant_id;
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS credential_definition;
    `);

    await queryRunner.query(`
      DROP TYPE IF EXISTS credential_definition_connector_type;
    `);

    await queryRunner.query(`
      DROP TYPE IF EXISTS credential_definition_format;
    `);
  }
}
