import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
} from '@nestjs/swagger';

import { CreateOAuthClientDto } from './dto/create-oauth-client.dto';
import { OAuthClientResponseDto } from './dto/oauth-client-response.dto';
import { OAuthClient } from './oauth-client.entity';
import { OAuthClientService } from './oauth-client.service';

@Controller('oauth-clients')
export class OAuthClientController {
  public constructor(private readonly oauthClientService: OAuthClientService) {}

  @Post()
  @ApiCreatedResponse({
    description: 'OAuth client created successfully',
    type: OAuthClientResponseDto,
  })
  @ApiBody({
    description: 'OAuth client creation request',
    type: CreateOAuthClientDto,
    examples: {
      example1: {
        summary: 'Create an OAuth client',
        value: {
          tenantId: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Mobile App',
          scopes: ['read:credentials', 'write:credentials'],
          redirectUris: ['https://app.example.com/callback'],
          grantTypes: ['authorization_code', 'refresh_token'],
          createdBy: '223e4567-e89b-12d3-a456-426614174000',
        },
      },
    },
  })
  public async createClient(
    @Body() dto: CreateOAuthClientDto,
  ): Promise<{ client: OAuthClientResponseDto; clientSecret: string }> {
    const { client, clientSecret } =
      await this.oauthClientService.createClient(dto);
    return {
      client: this.toResponseDto(client),
      clientSecret,
    };
  }

  @Get('client/:clientId')
  @ApiOkResponse({
    description: 'OAuth client found',
    type: OAuthClientResponseDto,
  })
  @ApiNotFoundResponse({ description: 'OAuth client not found' })
  public async findByClientId(
    @Param('clientId') clientId: string,
  ): Promise<OAuthClientResponseDto> {
    const client = await this.oauthClientService.findByClientId(clientId);
    return this.toResponseDto(client);
  }

  @Get('tenant/:tenantId')
  @ApiOkResponse({
    description: 'List of OAuth clients for the specified tenant',
    type: [OAuthClientResponseDto],
  })
  public async findByTenant(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
  ): Promise<OAuthClientResponseDto[]> {
    const clients = await this.oauthClientService.findByTenant(tenantId);
    return clients.map((client) => this.toResponseDto(client));
  }

  @Delete(':id/revoke')
  @ApiOkResponse({ description: 'OAuth client revoked successfully' })
  @ApiNotFoundResponse({ description: 'OAuth client not found' })
  public async revokeClient(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return await this.oauthClientService.revokeClient(id);
  }

  private toResponseDto(client: OAuthClient): OAuthClientResponseDto {
    return {
      id: client.id,
      tenantId: client.tenantId,
      clientId: client.clientId,
      name: client.name,
      scopes: client.scopes,
      redirectUris: client.redirectUris,
      grantTypes: client.grantTypes,
      createdBy: client.createdBy,
      createdAt: client.createdAt,
      revokedAt: client.revokedAt,
    };
  }
}
