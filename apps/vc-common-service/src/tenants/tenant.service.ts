import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

import { CreateTenantDto } from './dto/create-tenant.dto';
import { TenantRepository } from './tenant.repository';

@Injectable()
export class TenantService {
  public constructor(private readonly tenants: TenantRepository) {}

  public async create(dto: CreateTenantDto) {
    const existing = await this.tenants.findBySlug(dto.slug);

    if (existing) {
      throw new ConflictException('Tenant slug already exists');
    }

    const tenant = this.tenants.create(dto);

    return this.tenants.save(tenant);
  }

  public async update(id: string, dto: Partial<CreateTenantDto>) {
    const tenant = await this.tenants.findById(id);

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    Object.assign(tenant, dto);

    return this.tenants.save(tenant);
  }

  public async findAll() {
    return this.tenants.findAll();
  }

  public async findById(id: string) {
    const tenant = await this.tenants.findById(id);

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  public async findBySlug(slug: string) {
    return this.tenants.findBySlug(slug);
  }

  public async delete(id: string) {
    const tenant = await this.tenants.findById(id);

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    await this.tenants.delete(id);
  }

  public async restore(id: string) {
    const tenant = await this.tenants.findById(id);

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    await this.tenants.restore(id);
  }
}
