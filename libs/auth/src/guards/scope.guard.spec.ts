import { ExecutionContext } from '@nestjs/common';

import { ScopeGuard } from './scope.guard';

describe('ScopeGuard', () => {
  let guard: ScopeGuard;

  beforeEach(() => {
    guard = new ScopeGuard();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should return true (stub)', () => {
    const context = {} as ExecutionContext;
    expect(guard.canActivate(context)).toBe(true);
  });
});
