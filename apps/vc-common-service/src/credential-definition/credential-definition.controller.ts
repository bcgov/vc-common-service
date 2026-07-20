import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';

import {
  CredentialDefinition,
  CredentialDefinitionConnectorType,
  CredentialDefinitionFormat,
} from './credential-definition.entity';
import { CredentialDefinitionService } from './credential-definition.service';
import { CreateCredentialDefinitionDto } from './dto/create-credential-definition.dto';
import { UpdateCredentialDefinitionDto } from './dto/update-credential-definition.dto';

@Controller('credential-definitions')
export class CredentialDefinitionController {
  public constructor(
    private readonly credentialDefinitionService: CredentialDefinitionService,
  ) {}

  @Post()
  public async create(
    @Body() dto: CreateCredentialDefinitionDto,
  ): Promise<CredentialDefinition> {
    return await this.credentialDefinitionService.create(dto);
  }

  @Get(':id')
  public async findById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CredentialDefinition> {
    return await this.credentialDefinitionService.findById(id);
  }

  @Get('tenant/:tenantId')
  public async findByTenantId(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
  ): Promise<CredentialDefinition[]> {
    return await this.credentialDefinitionService.findByTenantId(tenantId);
  }

  @Get('format/:format')
  public async findByFormat(
    @Param('format', new ParseEnumPipe(CredentialDefinitionFormat))
    format: CredentialDefinitionFormat,
  ): Promise<CredentialDefinition[]> {
    return await this.credentialDefinitionService.findByFormat(format);
  }

  @Get('connector/:connectorType')
  public async findByConnector(
    @Param(
      'connectorType',
      new ParseEnumPipe(CredentialDefinitionConnectorType),
    )
    connectorType: CredentialDefinitionConnectorType,
  ): Promise<CredentialDefinition[]> {
    return await this.credentialDefinitionService.findByConnector(
      connectorType,
    );
  }

  @Patch(':id')
  public async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCredentialDefinitionDto,
  ): Promise<CredentialDefinition> {
    return await this.credentialDefinitionService.update(id, dto);
  }

  @Delete(':id')
  public async delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return await this.credentialDefinitionService.delete(id);
  }
}
