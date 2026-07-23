import { ConnectorType } from '../enums/connector-type.enum';
import { CredentialFormat } from '../enums/credential-format.enum';

import {
  createFullTenantSetup,
  createTestClient,
  createTestCredDef,
  createTestTenant,
  createTestUser,
} from './test-data.factory';

describe('test-data.factory', () => {
  describe('createTestTenant', () => {
    it('creates a fully populated tenant with defaults', () => {
      const tenant = createTestTenant();

      expect(tenant).toEqual({
        id: expect.any(String),
        name: expect.stringContaining('Test Tenant'),
        slug: expect.stringContaining('test-tenant-'),
        connectorId: expect.any(String),
        connectorType: ConnectorType.Traction,
        isActive: true,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('applies partial overrides while preserving defaults', () => {
      const tenant = createTestTenant({ name: 'Custom Tenant' });

      expect(tenant.name).toBe('Custom Tenant');
      expect(tenant.slug).toContain('test-tenant-');
      expect(tenant.connectorType).toBe(ConnectorType.Traction);
    });

    it('creates unique ids across calls', () => {
      const firstTenant = createTestTenant();
      const secondTenant = createTestTenant();

      expect(firstTenant.id).not.toBe(secondTenant.id);
      expect(firstTenant.connectorType).toBe(secondTenant.connectorType);
      expect(firstTenant.isActive).toBe(secondTenant.isActive);
    });
  });

  describe('createTestUser', () => {
    it('creates a fully populated owner user with defaults', () => {
      const user = createTestUser();

      expect(user).toEqual({
        id: expect.any(String),
        tenantId: expect.any(String),
        email: expect.stringContaining('@example.test'),
        displayName: expect.stringContaining('Owner'),
        role: 'owner',
        isActive: true,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('applies partial overrides while preserving defaults', () => {
      const user = createTestUser({ displayName: 'Avery Admin' });

      expect(user.displayName).toBe('Avery Admin');
      expect(user.role).toBe('owner');
      expect(user.email).toContain('@example.test');
    });

    it('creates unique ids across calls', () => {
      const firstUser = createTestUser();
      const secondUser = createTestUser();

      expect(firstUser.id).not.toBe(secondUser.id);
      expect(firstUser.role).toBe(secondUser.role);
      expect(firstUser.isActive).toBe(secondUser.isActive);
    });
  });

  describe('createTestClient', () => {
    it('creates a fully populated api client with defaults', () => {
      const client = createTestClient();

      expect(client).toEqual({
        id: expect.any(String),
        tenantId: expect.any(String),
        name: expect.stringContaining('API Client'),
        clientId: expect.stringContaining('client-'),
        clientSecret: expect.stringContaining('secret-'),
        scopes: ['credentials:write', 'presentations:write'],
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('applies partial overrides while preserving defaults', () => {
      const client = createTestClient({ scopes: ['credentials:read'] });

      expect(client.scopes).toEqual(['credentials:read']);
      expect(client.clientId).toContain('client-');
      expect(client.clientSecret).toContain('secret-');
    });

    it('creates unique ids across calls', () => {
      const firstClient = createTestClient();
      const secondClient = createTestClient();

      expect(firstClient.id).not.toBe(secondClient.id);
      expect(firstClient.name).toContain('API Client');
      expect(secondClient.name).toContain('API Client');
    });
  });

  describe('createTestCredDef', () => {
    it('creates a fully populated credential definition with defaults', () => {
      const credDef = createTestCredDef();

      expect(credDef).toEqual({
        id: expect.any(String),
        tenantId: expect.any(String),
        schemaId: expect.stringContaining('schema:'),
        format: CredentialFormat.AnonCreds,
        tag: expect.stringContaining('v1-'),
        attributes: ['given_name', 'family_name', 'employee_id'],
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('applies partial overrides while preserving defaults', () => {
      const credDef = createTestCredDef({ format: CredentialFormat.JsonLd });

      expect(credDef.format).toBe(CredentialFormat.JsonLd);
      expect(credDef.tag).toContain('v1-');
      expect(credDef.schemaId).toContain('schema:');
    });

    it('creates unique ids across calls', () => {
      const firstCredDef = createTestCredDef();
      const secondCredDef = createTestCredDef();

      expect(firstCredDef.id).not.toBe(secondCredDef.id);
      expect(firstCredDef.attributes).toEqual(secondCredDef.attributes);
      expect(firstCredDef.format).toBe(secondCredDef.format);
    });
  });

  describe('createFullTenantSetup', () => {
    it('creates a fully wired tenant setup', () => {
      const setup = createFullTenantSetup();

      expect(setup.owner.tenantId).toBe(setup.tenant.id);
      expect(setup.apiClient.tenantId).toBe(setup.tenant.id);
      expect(setup.credDef.tenantId).toBe(setup.tenant.id);
      expect(setup.connector.tenantId).toBe(setup.tenant.id);
      expect(setup.tenant.connectorId).toBe(setup.connector.id);
      expect(setup.tenant.connectorType).toBe(setup.connector.type);
    });

    it('applies nested overrides while keeping relationships consistent', () => {
      const setup = createFullTenantSetup({
        tenant: { name: 'Acme Tenant' },
        owner: { displayName: 'Acme Owner', tenantId: 'ignored-tenant-id' },
        client: { name: 'Acme Client', tenantId: 'ignored-tenant-id' },
        connector: { type: ConnectorType.Credo },
        credDef: {
          format: CredentialFormat.JsonLd,
          tenantId: 'ignored-tenant-id',
        },
      });

      expect(setup.tenant.name).toBe('Acme Tenant');
      expect(setup.owner.displayName).toBe('Acme Owner');
      expect(setup.apiClient.name).toBe('Acme Client');
      expect(setup.credDef.format).toBe(CredentialFormat.JsonLd);
      expect(setup.connector.type).toBe(ConnectorType.Credo);
      expect(setup.tenant.connectorType).toBe(ConnectorType.Credo);
      expect(setup.owner.tenantId).toBe(setup.tenant.id);
      expect(setup.apiClient.tenantId).toBe(setup.tenant.id);
      expect(setup.credDef.tenantId).toBe(setup.tenant.id);
      expect(setup.connector.tenantId).toBe(setup.tenant.id);
    });
  });
});
