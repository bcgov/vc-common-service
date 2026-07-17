import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';

import { CreateTenantUserDto } from './dto/create-tenant-user.dto';
import { TenantUser } from './tenant-user.entity';
import { TenantUserService } from './tenant-user.service';

@Controller('tenant-users')
export class TenantUserController {
  public constructor(private readonly tenantUserService: TenantUserService) {}

  @Post()
  public async create(@Body() dto: CreateTenantUserDto): Promise<TenantUser> {
    return await this.tenantUserService.create(dto);
  }

  @Get(':id')
  public async findById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TenantUser> {
    return await this.tenantUserService.findById(id);
  }

  @Get('tenant/:tenantId')
  public async findByTenantId(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
  ): Promise<TenantUser[]> {
    return await this.tenantUserService.findByTenantId(tenantId);
  }

  @Get('external/:externalUserId')
  public async findByExternalUserId(
    @Param('externalUserId') externalUserId: string,
  ): Promise<TenantUser[]> {
    return await this.tenantUserService.findByExternalUserId(externalUserId);
  }

  @Patch(':id')
  public async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<CreateTenantUserDto>,
  ): Promise<TenantUser> {
    return await this.tenantUserService.update(id, dto);
  }

  @Delete(':id')
  public async delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return await this.tenantUserService.delete(id);
  }
}
