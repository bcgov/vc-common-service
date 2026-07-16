import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';

import { CreateTenantDto } from './dto/create-tenant.dto';
import { Tenant } from './tenant.entity';
import { TenantService } from './tenant.service';

@Controller('tenants')
export class TenantController {
  public constructor(private readonly tenantService: TenantService) {}

  @Post()
  public async create(@Body() dto: CreateTenantDto): Promise<Tenant> {
    return this.tenantService.create(dto);
  }

  @Put(':id')
  public async update(
    @Body() dto: Partial<CreateTenantDto>,
    @Param('id') id: string,
  ): Promise<Tenant> {
    return this.tenantService.update(id, dto);
  }

  @Get()
  public async findAll(): Promise<Tenant[]> {
    return this.tenantService.findAll();
  }

  @Get(':id')
  public async findById(@Param('id') id: string): Promise<Tenant | null> {
    return this.tenantService.findById(id);
  }

  @Get('slug/:slug')
  public async findBySlug(@Param('slug') slug: string): Promise<Tenant | null> {
    return this.tenantService.findBySlug(slug);
  }

  @Delete(':id')
  public async delete(@Param('id') id: string): Promise<void> {
    return this.tenantService.delete(id);
  }

  @Post(':id/restore')
  public async restore(@Param('id') id: string): Promise<void> {
    return this.tenantService.restore(id);
  }
}
