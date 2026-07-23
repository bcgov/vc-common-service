import { createHash } from 'crypto';

import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { CreateOAuthClientDto } from './dto/create-oauth-client.dto';
import { OAuthClient } from './oauth-client.entity';
import { OAuthClientRepository } from './oauth-client.repository';
import { OAuthClientService } from './oauth-client.service';

describe('OAuthClientService', () => {
  let service: OAuthClientService;
  let mockFindByClientId: jest.Mock;
  let mockFindByTenant: jest.Mock;
  let mockCreate: jest.Mock;
  let mockRevoke: jest.Mock;
  let mockRepository: any;

  const mockOAuthClient: OAuthClient = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    tenantId: '123e4567-e89b-12d3-a456-426614174001',
    clientId: 'client_abc123',
    clientSecretHash: 'hashed_secret',
    name: 'Test Client',
    scopes: ['read:credentials'],
    redirectUris: ['https://example.com/callback'],
    grantTypes: ['client_credentials'],
    createdBy: '123e4567-e89b-12d3-a456-426614174002',
    createdAt: new Date(),
    tenant: undefined as any,
  };

  beforeEach(async () => {
    mockFindByClientId = jest.fn();
    mockFindByTenant = jest.fn();
    mockCreate = jest.fn();
    mockRevoke = jest.fn();

    mockRepository = {
      findOne: jest.fn(),
    };

    const mockOAuthClientRepository = {
      findByClientId: mockFindByClientId,
      findByTenant: mockFindByTenant,
      create: mockCreate,
      revoke: mockRevoke,
      repository: mockRepository,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OAuthClientService,
        {
          provide: OAuthClientRepository,
          useValue: mockOAuthClientRepository,
        },
      ],
    }).compile();

    service = module.get<OAuthClientService>(OAuthClientService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createClient', () => {
    it('should create a new OAuth client with generated credentials', async () => {
      const dto: CreateOAuthClientDto = {
        tenantId: mockOAuthClient.tenantId,
        name: mockOAuthClient.name,
        scopes: mockOAuthClient.scopes,
        redirectUris: mockOAuthClient.redirectUris,
        createdBy: mockOAuthClient.createdBy,
      };

      mockCreate.mockResolvedValue(mockOAuthClient);

      const result = await service.createClient(dto);

      expect(result.client).toBeDefined();
      expect(result.clientSecret).toBeDefined();
      expect(result.clientSecret).toHaveLength(64); // hex string of 32 bytes
      expect(mockCreate).toHaveBeenCalled();
    });
  });

  describe('findByClientId', () => {
    it('should find an OAuth client by client ID', async () => {
      mockFindByClientId.mockResolvedValue(mockOAuthClient);

      const result = await service.findByClientId(mockOAuthClient.clientId);

      expect(mockFindByClientId).toHaveBeenCalledWith(mockOAuthClient.clientId);
      expect(result).toEqual(mockOAuthClient);
    });

    it('should throw NotFoundException if client not found', async () => {
      mockFindByClientId.mockResolvedValue(null);

      await expect(service.findByClientId('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByTenant', () => {
    it('should find all OAuth clients for a tenant', async () => {
      mockFindByTenant.mockResolvedValue([mockOAuthClient]);

      const result = await service.findByTenant(mockOAuthClient.tenantId);

      expect(mockFindByTenant).toHaveBeenCalledWith(mockOAuthClient.tenantId);
      expect(result).toEqual([mockOAuthClient]);
    });
  });

  describe('revokeClient', () => {
    it('should revoke an OAuth client', async () => {
      mockFindByClientId.mockResolvedValue(mockOAuthClient);
      mockRevoke.mockResolvedValue(undefined);

      await service.revokeClient(mockOAuthClient.id);

      expect(mockFindByClientId).toHaveBeenCalledWith(mockOAuthClient.id);
      expect(mockRevoke).toHaveBeenCalledWith(mockOAuthClient.id);
    });

    it('should throw NotFoundException if client not found', async () => {
      mockFindByClientId.mockResolvedValue(null);

      await expect(service.revokeClient('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('verifyClientSecret', () => {
    it('should verify a valid client secret', async () => {
      const clientSecret = 'test_secret_123';
      const secretHash = createHash('sha256')
        .update(clientSecret)
        .digest('hex');

      const clientWithHash: OAuthClient = {
        ...mockOAuthClient,
        clientSecretHash: secretHash,
        revokedAt: undefined,
      };

      mockFindByClientId.mockResolvedValue(clientWithHash);

      const result = await service.verifyClientSecret(
        mockOAuthClient.clientId,
        clientSecret,
      );

      expect(result).toBe(true);
    });

    it('should return false for invalid secret', async () => {
      mockFindByClientId.mockResolvedValue(mockOAuthClient);

      const result = await service.verifyClientSecret(
        mockOAuthClient.clientId,
        'wrong_secret',
      );

      expect(result).toBe(false);
    });

    it('should return false for revoked client', async () => {
      const revokedClient: OAuthClient = {
        ...mockOAuthClient,
        revokedAt: new Date(),
      };

      mockFindByClientId.mockResolvedValue(revokedClient);

      const result = await service.verifyClientSecret(
        mockOAuthClient.clientId,
        'any_secret',
      );

      expect(result).toBe(false);
    });
  });
});
