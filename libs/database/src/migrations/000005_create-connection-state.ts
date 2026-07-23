import { MigrationInterface, QueryRunner } from 'typeorm';

export const migrationName = 'CreateConnectionState';

export class CreateConnectionState1784732194397 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_type
          WHERE typname = 'connector_type_enum'
        ) THEN
          CREATE TYPE connector_type_enum AS ENUM (
            'traction',
            'credo'
          );
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_type
          WHERE typname = 'connection_state_enum'
        ) THEN
          CREATE TYPE connection_state_enum AS ENUM (
            'invited',
            'requested',
            'responded',
            'active',
            'completed',
            'abandoned'
          );
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_type
          WHERE typname = 'connection_protocol_enum'
        ) THEN
          CREATE TYPE connection_protocol_enum AS ENUM (
            'didcomm-v1',
            'didcomm-v2',
            'openid4vc'
          );
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE connection (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

        tenant_id UUID NOT NULL,
        external_connection_id VARCHAR(255) NOT NULL,

        their_label VARCHAR(255),
        their_did VARCHAR(255),

        state connection_state_enum NOT NULL,

        connector_type connector_type_enum NOT NULL,

        protocol connection_protocol_enum NOT NULL,

        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT fk_connection_tenant
          FOREIGN KEY (tenant_id)
          REFERENCES tenant(id)
          ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE INDEX idx_connection_tenant_state
        ON connection (tenant_id, state);
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_connection_external_connection_id
        ON connection (external_connection_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_connection_external_connection_id;
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_connection_tenant_state;
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS connection;
    `);

    await queryRunner.query(`
      DROP TYPE IF EXISTS connection_protocol_enum;
    `);

    await queryRunner.query(`
      DROP TYPE IF EXISTS connection_state_enum;
    `);

    // Leave connector_type_enum in place since it is shared by other tables.
  }
}
