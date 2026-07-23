-- Placeholder integration-test seed data.
-- The application does not have tenant/user tables yet, so this creates a
-- small idempotent marker table proving the migrate -> seed pipeline ran.
CREATE TABLE IF NOT EXISTS test_seed_metadata (
  key text PRIMARY KEY,
  value text NOT NULL,
  seeded_at timestamptz NOT NULL DEFAULT NOW()
);

INSERT INTO test_seed_metadata (key, value)
VALUES ('default-fixture', 'placeholder baseline fixture for integration tests')
ON CONFLICT (key) DO UPDATE
SET
  value = EXCLUDED.value,
  seeded_at = NOW();
