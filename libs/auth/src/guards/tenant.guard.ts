import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class TenantGuard implements CanActivate {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public canActivate(context: ExecutionContext): boolean {
    // TODO: Verify JWT tenant_id matches route :tenantId param
    return true;
  }
}
