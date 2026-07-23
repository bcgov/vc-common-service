import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
} from '@nestjs/swagger';

import { ConnectorType } from '../connection/connection.entity';

import { ConnectorCredential } from './connector-credential.entity';
import { ConnectorCredentialService } from './connector-credential.service';
import { CreateConnectorCredentialDto } from './dto/create-connector-credential.dto';
import { UpdateConnectorCredentialDto } from './dto/update-connector-credential.dto';

@Controller('connector-credentials')
export class ConnectorCredentialController {
  public constructor(
    private readonly credentialService: ConnectorCredentialService,
  ) {}

  @Post()
  @ApiCreatedResponse({
    description: 'Connector credential created successfully',
    type: ConnectorCredential,
  })
  public async create(
    @Body() dto: CreateConnectorCredentialDto,
  ): Promise<ConnectorCredential> {
    return await this.credentialService.create(dto);
  }

  @Get(':id')
  @ApiOkResponse({
    description: 'Connector credential found',
    type: ConnectorCredential,
  })
  @ApiNotFoundResponse({ description: 'Connector credential not found' })
  public async findById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ConnectorCredential> {
    return await this.credentialService.findById(id);
  }

  @Get('tenant/:tenantId')
  @ApiOkResponse({
    description: 'List of connector credentials for the specified tenant',
    type: [ConnectorCredential],
  })
  public async findByTenant(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Query('connectorType') connectorType?: ConnectorType,
    @Query('active') active?: string,
  ): Promise<ConnectorCredential[]> {
    if (connectorType && active !== undefined) {
      const isActive = active === 'true';
      return await this.credentialService.findByTenantAndConnectorTypeAndActive(
        tenantId,
        connectorType,
        isActive,
      );
    }

    if (connectorType) {
      return await this.credentialService.findByTenantAndConnectorType(
        tenantId,
        connectorType,
      );
    }

    return await this.credentialService.findByTenant(tenantId);
  }

  @Patch(':id')
  @ApiOkResponse({
    description: 'Connector credential updated successfully',
    type: ConnectorCredential,
  })
  @ApiNotFoundResponse({ description: 'Connector credential not found' })
  public async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateConnectorCredentialDto,
  ): Promise<ConnectorCredential> {
    return await this.credentialService.update(id, dto);
  }

  @Delete(':id')
  @ApiOkResponse({ description: 'Connector credential deleted successfully' })
  @ApiNotFoundResponse({ description: 'Connector credential not found' })
  public async delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return await this.credentialService.delete(id);
  }
}
