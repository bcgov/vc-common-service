import { Test, TestingModule } from '@nestjs/testing';

import { ConnectorType } from '../connection/connection.entity';

import { ConnectorCredentialController } from './connector-credential.controller';
import { ConnectorCredential } from './connector-credential.entity';
import { ConnectorCredentialService } from './connector-credential.service';
import { CreateConnectorCredentialDto } from './dto/create-connector-credential.dto';

describe('ConnectorCredentialController', () => {
  let controller: ConnectorCredentialController;

  let mockCreate: jest.Mock;
  let mockFindById: jest.Mock;
  let mockFindByTenant: jest.Mock;
  let mockFindByTenantAndConnectorType: jest.Mock;
  let mockFindByTenantAndConnectorTypeAndActive: jest.Mock;
  let mockUpdate: jest.Mock;
  let mockDelete: jest.Mock;

  const mockCredential: ConnectorCredential = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    tenantId: '123e4567-e89b-12d3-a456-426614174001',
    connectorType: ConnectorType.TRACTION,
    credentialsEncrypted: Buffer.from('encrypted_data'),
    endpointUrl: 'https://api.salesforce.com/v57.0',
    active: true,
    keyVersion: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    tenant: undefined as any,
  };

  beforeEach(async () => {
    mockCreate = jest.fn();
    mockFindById = jest.fn();
    mockFindByTenant = jest.fn();
    mockFindByTenantAndConnectorType = jest.fn();
    mockFindByTenantAndConnectorTypeAndActive = jest.fn();
    mockUpdate = jest.fn();
    mockDelete = jest.fn();

    const mockService = {
      create: mockCreate,
      findById: mockFindById,
      findByTenant: mockFindByTenant,
      findByTenantAndConnectorType: mockFindByTenantAndConnectorType,
      findByTenantAndConnectorTypeAndActive:
        mockFindByTenantAndConnectorTypeAndActive,
      update: mockUpdate,
      delete: mockDelete,
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConnectorCredentialController],
      providers: [
        {
          provide: ConnectorCredentialService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<ConnectorCredentialController>(
      ConnectorCredentialController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /connector-credentials', () => {
    it('should create a new connector credential', async () => {
      const dto: CreateConnectorCredentialDto = {
        tenantId: mockCredential.tenantId,
        connectorType: mockCredential.connectorType,
        credentialsEncrypted: Buffer.from('encrypted_data').toString('base64'),
        endpointUrl: mockCredential.endpointUrl,
        active: mockCredential.active,
        keyVersion: mockCredential.keyVersion,
      };

      mockCreate.mockResolvedValue(mockCredential);

      const result = await controller.create(dto);

      expect(mockCreate).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockCredential);
    });
  });

  describe('GET /connector-credentials/:id', () => {
    it('should find a credential by ID', async () => {
      mockFindById.mockResolvedValue(mockCredential);

      const result = await controller.findById(mockCredential.id);

      expect(mockFindById).toHaveBeenCalledWith(mockCredential.id);
      expect(result).toEqual(mockCredential);
    });
  });

  describe('GET /connector-credentials/tenant/:tenantId', () => {
    it('should find all credentials for a tenant', async () => {
      mockFindByTenant.mockResolvedValue([mockCredential]);

      const result = await controller.findByTenant(mockCredential.tenantId);

      expect(mockFindByTenant).toHaveBeenCalledWith(mockCredential.tenantId);
      expect(result).toEqual([mockCredential]);
    });

    it('should filter by connector type when provided', async () => {
      mockFindByTenantAndConnectorType.mockResolvedValue([mockCredential]);

      const result = await controller.findByTenant(
        mockCredential.tenantId,
        mockCredential.connectorType,
      );

      expect(mockFindByTenantAndConnectorType).toHaveBeenCalledWith(
        mockCredential.tenantId,
        mockCredential.connectorType,
      );
      expect(result).toEqual([mockCredential]);
    });

    it('should filter by connector type and active status when both provided', async () => {
      mockFindByTenantAndConnectorTypeAndActive.mockResolvedValue([
        mockCredential,
      ]);

      const result = await controller.findByTenant(
        mockCredential.tenantId,
        mockCredential.connectorType,
        'true',
      );

      expect(mockFindByTenantAndConnectorTypeAndActive).toHaveBeenCalledWith(
        mockCredential.tenantId,
        mockCredential.connectorType,
        true,
      );
      expect(result).toEqual([mockCredential]);
    });
  });

  describe('PATCH /connector-credentials/:id', () => {
    it('should update a connector credential', async () => {
      const updateDto = { active: false };
      const updatedCredential = { ...mockCredential, active: false };

      mockUpdate.mockResolvedValue(updatedCredential);

      const result = await controller.update(mockCredential.id, updateDto);

      expect(mockUpdate).toHaveBeenCalledWith(mockCredential.id, updateDto);
      expect(result).toEqual(updatedCredential);
    });
  });

  describe('DELETE /connector-credentials/:id', () => {
    it('should delete a connector credential', async () => {
      mockDelete.mockResolvedValue(undefined);

      await controller.delete(mockCredential.id);

      expect(mockDelete).toHaveBeenCalledWith(mockCredential.id);
    });
  });
});
