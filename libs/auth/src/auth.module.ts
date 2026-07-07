import { Module } from '@nestjs/common';

import { JwtGuard } from './guards/jwt.guard';
import { ScopeGuard } from './guards/scope.guard';
import { TenantGuard } from './guards/tenant.guard';

@Module({
  providers: [JwtGuard, ScopeGuard, TenantGuard],
  exports: [JwtGuard, ScopeGuard, TenantGuard],
})
export class AuthModule {}
