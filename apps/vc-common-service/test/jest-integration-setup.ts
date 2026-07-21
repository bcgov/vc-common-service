import './jest-e2e-setup';

const requiredEnvVars = [
  'DB_HOST',
  'DB_PORT',
  'DB_USERNAME',
  'DB_PASSWORD',
  'DB_NAME',
] as const;

const missingEnvVars = requiredEnvVars.filter(
  (envVar) => !process.env[envVar]?.trim(),
);

if (missingEnvVars.length > 0) {
  throw new Error(
    `Integration tests require ${missingEnvVars.join(', ')}. ` +
      'Start the test database with `docker compose --profile test up -d db-test migrate-test seed-test` ' +
      'and export the matching DB_* variables before running `npm run test:integration`.',
  );
}
