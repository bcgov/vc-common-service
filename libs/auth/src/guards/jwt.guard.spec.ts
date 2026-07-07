import { ExecutionContext } from '@nestjs/common';

import { JwtGuard } from './jwt.guard';

describe('JwtGuard', () => {
  let guard: JwtGuard;

  beforeEach(() => {
    guard = new JwtGuard();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should return true (stub)', () => {
    const context = {} as ExecutionContext;
    expect(guard.canActivate(context)).toBe(true);
  });
});
