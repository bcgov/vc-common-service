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

  it('should throw not implemented error (fail closed)', () => {
    const context = {} as ExecutionContext;
    expect(() => guard.canActivate(context)).toThrow(
      'TenantGuard not implemented',
    );
  });
});
