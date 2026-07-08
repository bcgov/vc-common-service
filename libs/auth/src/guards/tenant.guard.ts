import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class TenantGuard implements CanActivate {
  // TODO: Verify JWT tenant_id matches route :tenantId param
  public canActivate(_context: ExecutionContext): boolean {
    throw new Error('TenantGuard not implemented');
  }
}
