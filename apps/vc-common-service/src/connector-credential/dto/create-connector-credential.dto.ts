import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

import { ConnectorType } from '../../connection/connection.entity';

export class CreateConnectorCredentialDto {
  @ApiProperty({
    description: 'The tenant ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  public tenantId!: string;

  @ApiProperty({
    description: 'The connector type',
    enum: ConnectorType,
    example: ConnectorType.TRACTION,
  })
  @IsEnum(ConnectorType)
  public connectorType!: ConnectorType;

  @ApiProperty({
    description: 'The encrypted credentials (base64 encoded)',
  })
  @IsString()
  public credentialsEncrypted!: string;

  @ApiProperty({
    description: 'The endpoint URL for the connector',
    example: 'https://api.salesforce.com/v57.0',
  })
  @IsString()
  public endpointUrl!: string;

  @ApiProperty({
    description: 'Whether this credential is active',
    required: false,
    example: true,
  })
  @IsOptional()
  public active?: boolean;

  @ApiProperty({
    description: 'The version of the encryption key used',
    required: false,
    example: 1,
  })
  @IsOptional()
  public keyVersion?: number;
}
