import { randomUUID } from 'node:crypto';

import { ConnectorType } from '../enums/connector-type.enum';
import { CredentialFormat } from '../enums/credential-format.enum';

// Fixture factories for tests. Each function fills in UUID-backed ids and
// ISO-8601 timestamps by default and accepts partial overrides for anything
// a test needs to control.

export interface TestTenant {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly connectorId: string;
  readonly connectorType: ConnectorType;
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface TestUser {
  readonly id: string;
  readonly tenantId: string;
  readonly email: string;
  readonly displayName: string;
  readonly role: 'owner' | 'member';
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface TestClient {
  readonly id: string;
  readonly tenantId: string;
  readonly name: string;
  readonly clientId: string;
  readonly clientSecret: string;
  readonly scopes: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface TestCredDef {
  readonly id: string;
  readonly tenantId: string;
  readonly schemaId: string;
  readonly format: CredentialFormat;
  readonly tag: string;
  readonly attributes: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface TestConnector {
  readonly id: string;
  readonly tenantId: string;
  readonly type: ConnectorType;
  readonly name: string;
  readonly baseUrl: string;
  readonly apiKey: string;
  readonly isDefault: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface TestFullTenantSetup {
  readonly tenant: TestTenant;
  readonly owner: TestUser;
  readonly connector: TestConnector;
  readonly apiClient: TestClient;
  readonly credDef: TestCredDef;
}

interface TestFullTenantSetupOverrides {
  readonly tenant?: Partial<TestTenant>;
  readonly owner?: Partial<TestUser>;
  readonly client?: Partial<TestClient>;
  readonly connector?: Partial<TestConnector>;
  readonly credDef?: Partial<TestCredDef>;
}

export function createTestTenant(
  overrides: Partial<TestTenant> = {},
): TestTenant {
  const id = overrides.id ?? randomUUID();
  const connectorId = overrides.connectorId ?? randomUUID();
  const timestamp = createTimestamp();
  const suffix = getSuffix(id);

  return {
    id,
    name: `Test Tenant ${suffix}`,
    slug: `test-tenant-${suffix}`,
    connectorId,
    connectorType: ConnectorType.Traction,
    isActive: true,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };
}

export function createTestUser(overrides: Partial<TestUser> = {}): TestUser {
  const id = overrides.id ?? randomUUID();
  const tenantId = overrides.tenantId ?? randomUUID();
  const timestamp = createTimestamp();
  const suffix = getSuffix(id);

  return {
    id,
    tenantId,
    email: `owner-${suffix}@example.test`,
    displayName: `Owner ${suffix}`,
    role: 'owner',
    isActive: true,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };
}

export function createTestClient(
  overrides: Partial<TestClient> = {},
): TestClient {
  const id = overrides.id ?? randomUUID();
  const tenantId = overrides.tenantId ?? randomUUID();
  const timestamp = createTimestamp();
  const suffix = getSuffix(id);

  return {
    id,
    tenantId,
    name: `API Client ${suffix}`,
    clientId: `client-${suffix}`,
    clientSecret: `secret-${randomUUID()}`,
    scopes: ['credentials:write', 'presentations:write'],
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };
}

export function createTestCredDef(
  overrides: Partial<TestCredDef> = {},
): TestCredDef {
  const id = overrides.id ?? randomUUID();
  const tenantId = overrides.tenantId ?? randomUUID();
  const timestamp = createTimestamp();
  const suffix = getSuffix(id);

  return {
    id,
    tenantId,
    schemaId: `schema:${tenantId}:employment:${suffix}`,
    format: CredentialFormat.AnonCreds,
    tag: `v1-${suffix}`,
    attributes: ['given_name', 'family_name', 'employee_id'],
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };
}

/**
 * Creates a fully wired tenant fixture bundle consisting of tenant, owner,
 * connector, API client, and credential definition records. Nested overrides are
 * applied shallowly while tenant relationships remain consistent.
 */
export function createFullTenantSetup(
  overrides: TestFullTenantSetupOverrides = {},
): TestFullTenantSetup {
  const tenant = createTestTenant(overrides.tenant);
  const connector = createTestConnector({
    ...overrides.connector,
    id: overrides.connector?.id ?? tenant.connectorId,
    tenantId: tenant.id,
    type: overrides.connector?.type ?? tenant.connectorType,
  });
  const normalizedTenant: TestTenant = {
    ...tenant,
    connectorId: connector.id,
    connectorType: connector.type,
  };
  const owner = createTestUser({
    ...overrides.owner,
    tenantId: normalizedTenant.id,
  });
  const apiClient = createTestClient({
    ...overrides.client,
    tenantId: normalizedTenant.id,
  });
  const credDef = createTestCredDef({
    ...overrides.credDef,
    tenantId: normalizedTenant.id,
  });

  return {
    tenant: normalizedTenant,
    owner,
    connector,
    apiClient,
    credDef,
  };
}

function createTestConnector(
  overrides: Partial<TestConnector> = {},
): TestConnector {
  const id = overrides.id ?? randomUUID();
  const tenantId = overrides.tenantId ?? randomUUID();
  const timestamp = createTimestamp();
  const suffix = getSuffix(id);

  return {
    id,
    tenantId,
    type: ConnectorType.Traction,
    name: `Traction Connector ${suffix}`,
    baseUrl: `https://traction-${suffix}.example.test`,
    apiKey: `api-key-${randomUUID()}`,
    isDefault: true,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };
}

function createTimestamp(): string {
  return new Date().toISOString();
}

function getSuffix(id: string): string {
  return id.split('-')[0] ?? id;
}
