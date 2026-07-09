import { ExecutionContext, NotImplementedException } from '@nestjs/common';

import { ScopeGuard } from './scope.guard';

describe('ScopeGuard', () => {
  let guard: ScopeGuard;

  beforeEach(() => {
    guard = new ScopeGuard();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should throw not implemented error (fail closed)', () => {
    const context = {} as ExecutionContext;
    expect(() => guard.canActivate(context)).toThrow(NotImplementedException);
  });
});
