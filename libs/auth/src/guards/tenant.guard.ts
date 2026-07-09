import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotImplementedException,
} from '@nestjs/common';

@Injectable()
export class TenantGuard implements CanActivate {
  // TODO: Verify JWT tenant_id matches route :tenantId param
  public canActivate(_context: ExecutionContext): boolean {
    throw new NotImplementedException('TenantGuard not implemented');
  }
}
