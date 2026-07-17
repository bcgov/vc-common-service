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

import { Tenant } from '../tenants/tenant.entity';

export enum TenantUserRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  READONLY = 'readonly',
}

export enum TenantUserStatus {
  ACTIVE = 'active',
  INVITED = 'invited',
  DISABLED = 'disabled',
}

@Entity({ name: 'tenant_user' })
@Unique('uq_tenant_user_external_user', ['tenantId', 'externalUserId'])
@Index('idx_tenant_user_tenant_id', ['tenantId'])
@Index('idx_tenant_user_external_user_id', ['externalUserId'])
export class TenantUser {
  @PrimaryGeneratedColumn('uuid')
  public id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  public tenantId!: string;

  @ManyToOne(() => Tenant, (tenant) => tenant.users, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tenant_id' })
  public tenant!: Tenant;

  /**
   * Keycloak subject (`sub`)
   */
  @Column({ name: 'external_user_id', type: 'varchar', length: 255 })
  public externalUserId!: string;

  @Column({ type: 'varchar', length: 255 })
  public email!: string;

  @Column({
    name: 'display_name',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  public displayName?: string;

  @Column({
    type: 'enum',
    enum: TenantUserRole,
    default: TenantUserRole.MEMBER,
  })
  public role!: TenantUserRole;

  @Column({
    type: 'enum',
    enum: TenantUserStatus,
    default: TenantUserStatus.INVITED,
  })
  public status!: TenantUserStatus;

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
