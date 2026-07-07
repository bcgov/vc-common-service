import { ExecutionContext } from '@nestjs/common';

import { TenantGuard } from './tenant.guard';

describe('TenantGuard', () => {
  let guard: TenantGuard;

  beforeEach(() => {
    guard = new TenantGuard();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should return true (stub)', () => {
    const context = {} as ExecutionContext;
    expect(guard.canActivate(context)).toBe(true);
  });
});
