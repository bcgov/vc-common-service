import { ExecutionContext, NotImplementedException } from '@nestjs/common';

import { JwtGuard } from './jwt.guard';

describe('JwtGuard', () => {
  let guard: JwtGuard;

  beforeEach(() => {
    guard = new JwtGuard();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should throw not implemented error (fail closed)', () => {
    const context = {} as ExecutionContext;
    expect(() => guard.canActivate(context)).toThrow(NotImplementedException);
  });
});
