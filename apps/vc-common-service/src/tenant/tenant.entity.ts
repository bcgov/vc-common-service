import {
  IsEnum,
  IsOptional,
  IsString,
  Length,
  IsObject,
} from 'class-validator';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  OneToMany,
} from 'typeorm';

import { TenantUser } from '../tenant-user/tenant-user.entity';

export enum TenantStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  DEACTIVATED = 'deactivated',
}

@Entity('tenant')
@Index('idx_tenant_slug', ['slug'], { unique: true })
@Index('idx_tenant_status', ['status'])
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  public id!: string;

  @Column({
    length: 255,
  })
  @IsString()
  @Length(1, 255)
  public name!: string;

  @Column({
    length: 100,
    unique: true,
  })
  @IsString()
  @Length(1, 100)
  public slug!: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  public description?: string;

  @Column({
    type: 'enum',
    enum: TenantStatus,
    default: TenantStatus.ACTIVE,
  })
  @IsEnum(TenantStatus)
  public status!: TenantStatus;

  @Column({
    type: 'jsonb',
    default: {},
  })
  @IsObject()
  public config!: Record<string, unknown>;

  @CreateDateColumn({
    type: 'timestamptz',
  })
  public created_at!: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
  })
  public updated_at!: Date;

  @DeleteDateColumn({
    type: 'timestamptz',
    nullable: true,
  })
  public deleted_at?: Date;
}
