import { MigrationInterface, QueryRunner } from 'typeorm';

export const migrationName = 'CreateOperationEntity';

export class CreateOperationEntity1784242000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enum type for the operation lifecycle state
    await queryRunner.query(`
      CREATE TYPE operation_state AS ENUM (
          'pending',
          'processing',
          'completed',
          'failed'
      );
    `);

    // Create operation table
    await queryRunner.query(`
      CREATE TABLE operation (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

          tenant_id UUID NOT NULL,
          batch_id UUID, -- nullable self-reference; NULL for standalone operations

          type VARCHAR(50) NOT NULL,
          state operation_state NOT NULL DEFAULT 'pending',

          request JSONB NOT NULL, -- persisted request context { method, path, body } (may contain PII)
          result JSONB,           -- state-dependent result payload; NULL while pending

          external_id VARCHAR(255),

          viewed_at TIMESTAMPTZ,
          expires_at TIMESTAMPTZ NOT NULL,

          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

          -- Operations are independent of tenant deletion: tenants are soft-deleted at
          -- runtime and operations self-purge via PE-08 (#31). RESTRICT prevents a tenant
          -- hard-delete from silently destroying in-flight/auditable operations.
          CONSTRAINT fk_operation_tenant
              FOREIGN KEY (tenant_id)
              REFERENCES tenant(id)
              ON DELETE RESTRICT,

          -- Deleting a batch parent removes its child operations.
          CONSTRAINT fk_operation_batch
              FOREIGN KEY (batch_id)
              REFERENCES operation(id)
              ON DELETE CASCADE
      );
    `);

    // Filtered listing: (tenant_id, state) and (tenant_id, type, state)
    await queryRunner.query(`
      CREATE INDEX idx_operation_tenant_state ON operation (tenant_id, state);
    `);
    await queryRunner.query(`
      CREATE INDEX idx_operation_tenant_type_state ON operation (tenant_id, type, state);
    `);

    // Cursor pagination on creation time
    await queryRunner.query(`
      CREATE INDEX idx_operation_tenant_created_at ON operation (tenant_id, created_at DESC);
    `);

    // Lookup by back-end agent identifier
    await queryRunner.query(`
      CREATE INDEX idx_operation_external_id ON operation (external_id);
    `);

    // Expiry scan for the purge job (PE-08 / #31).
    // NOTE: the issue's literal spec of `WHERE expires_at < now()` is intentionally NOT used:
    // now() is STABLE (not IMMUTABLE) and Postgres rejects it in an index predicate. The max
    // TTL horizon is 7 days, so a plain btree is correct and cheap; the purge query applies the
    // `expires_at < now()` range filter at DELETE time.
    await queryRunner.query(`
      CREATE INDEX idx_operation_expires_at ON operation (expires_at);
    `);

    // Batch child lookup and aggregation; partial index keeps it small (standalone ops excluded).
    await queryRunner.query(`
      CREATE INDEX idx_operation_batch_id ON operation (batch_id) WHERE batch_id IS NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE operation;
    `);

    await queryRunner.query(`
      DROP TYPE operation_state;
    `);
  }
}
