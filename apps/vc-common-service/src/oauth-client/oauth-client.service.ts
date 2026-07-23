import { randomBytes } from 'crypto';
import { createHash } from 'crypto';

import { Injectable, NotFoundException } from '@nestjs/common';

import { CreateOAuthClientDto } from './dto/create-oauth-client.dto';
import { OAuthClient } from './oauth-client.entity';
import { OAuthClientRepository } from './oauth-client.repository';

@Injectable()
export class OAuthClientService {
  public constructor(
    private readonly oauthClientRepository: OAuthClientRepository,
  ) {}

  public async createClient(
    dto: CreateOAuthClientDto,
  ): Promise<{ client: OAuthClient; clientSecret: string }> {
    const clientSecret = randomBytes(32).toString('hex');
    const clientId = this.generateClientId();
    const clientSecretHash = this.hashClientSecret(clientSecret);

    const client = await this.oauthClientRepository.create({
      tenantId: dto.tenantId,
      clientId,
      clientSecretHash,
      name: dto.name,
      scopes: dto.scopes || [],
      redirectUris: dto.redirectUris || [],
      grantTypes: dto.grantTypes || ['client_credentials'],
      createdBy: dto.createdBy,
    } as OAuthClient);

    return { client, clientSecret };
  }

  public async findByClientId(clientId: string): Promise<OAuthClient> {
    const client = await this.oauthClientRepository.findByClientId(clientId);

    if (!client) {
      throw new NotFoundException(
        `OAuth client with ID '${clientId}' was not found.`,
      );
    }

    return client;
  }

  public async findByTenant(tenantId: string): Promise<OAuthClient[]> {
    return await this.oauthClientRepository.findByTenant(tenantId);
  }

  public async revokeClient(id: string): Promise<void> {
    const client = await this.oauthClientRepository.findByClientId(id);

    if (!client) {
      throw new NotFoundException(`OAuth client '${id}' was not found.`);
    }

    await this.oauthClientRepository.revoke(id);
  }

  public async verifyClientSecret(
    clientId: string,
    clientSecret: string,
  ): Promise<boolean> {
    const client = await this.findByClientId(clientId);

    if (client.revokedAt) {
      return false;
    }

    const secretHash = this.hashClientSecret(clientSecret);
    return secretHash === client.clientSecretHash;
  }

  private generateClientId(): string {
    return `client_${randomBytes(16).toString('hex')}`;
  }

  private hashClientSecret(secret: string): string {
    return createHash('sha256').update(secret).digest('hex');
  }
}
