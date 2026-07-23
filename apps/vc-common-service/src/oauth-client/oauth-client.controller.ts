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
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';

import { CreateOAuthClientDto } from './dto/create-oauth-client.dto';
import { OAuthClient } from './oauth-client.entity';
import { OAuthClientService } from './oauth-client.service';

@Controller('oauth-clients')
export class OAuthClientController {
  public constructor(private readonly oauthClientService: OAuthClientService) {}

  @Post()
  @ApiCreatedResponse({
    description: 'OAuth client created successfully',
    type: OAuthClient,
  })
  public async createClient(
    @Body() dto: CreateOAuthClientDto,
  ): Promise<{ client: OAuthClient; clientSecret: string }> {
    return await this.oauthClientService.createClient(dto);
  }

  @Get('client/:clientId')
  @ApiOkResponse({
    description: 'OAuth client found',
    type: OAuthClient,
  })
  @ApiNotFoundResponse({ description: 'OAuth client not found' })
  public async findByClientId(
    @Param('clientId') clientId: string,
  ): Promise<OAuthClient> {
    return await this.oauthClientService.findByClientId(clientId);
  }

  @Get('tenant/:tenantId')
  @ApiOkResponse({
    description: 'List of OAuth clients for the specified tenant',
    type: [OAuthClient],
  })
  @ApiNotFoundResponse({ description: 'Tenant not found' })
  public async findByTenant(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
  ): Promise<OAuthClient[]> {
    return await this.oauthClientService.findByTenant(tenantId);
  }

  @Delete(':id/revoke')
  @ApiOkResponse({ description: 'OAuth client revoked successfully' })
  @ApiNotFoundResponse({ description: 'OAuth client not found' })
  public async revokeClient(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return await this.oauthClientService.revokeClient(id);
  }
}
