import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { Tenant } from '../tenant/tenant.entity';

export enum CredentialDefinitionFormat {
  ANONCREDS = 'anoncreds',
  SD_JWT = 'sd-jwt',
  MDL = 'mdl',
  W3C_VC = 'w3c-vc',
}

export enum CredentialDefinitionConnectorType {
  TRACTION = 'traction',
  CREDO = 'credo',
}

@Entity({ name: 'credential_definition' })
@Unique('uq_credential_definition_tenant_name_format', [
  'tenantId',
  'name',
  'format',
])
@Index('idx_credential_definition_tenant_id', ['tenantId'])
@Index('idx_credential_definition_format', ['format'])
@Index('idx_credential_definition_tenant_connector', [
  'tenantId',
  'connectorType',
])
@Index('idx_credential_definition_external_id', ['externalId'])
export class CredentialDefinition {
  @PrimaryGeneratedColumn('uuid')
  public id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  public tenantId!: string;

  @ManyToOne(() => Tenant, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tenant_id' })
  public tenant!: Tenant;

  @Column({ type: 'varchar', length: 255 })
  public name!: string;

  @Column({
    type: 'enum',
    enum: CredentialDefinitionFormat,
  })
  public format!: CredentialDefinitionFormat;

  @Column({
    name: 'schema_definition',
    type: 'jsonb',
  })
  public schemaDefinition!: Record<string, unknown>;

  @Column({ name: 'external_id', type: 'varchar', length: 255 })
  public externalId!: string;

  @Column({
    name: 'connector_type',
    type: 'enum',
    enum: CredentialDefinitionConnectorType,
  })
  public connectorType!: CredentialDefinitionConnectorType;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  public metadata?: Record<string, unknown>;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  public createdAt!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
  })
  public updatedAt!: Date;
}
