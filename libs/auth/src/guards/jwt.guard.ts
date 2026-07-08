import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class JwtGuard implements CanActivate {
  // TODO: Validate app-issued JWT signature + expiry
  public canActivate(_context: ExecutionContext): boolean {
    throw new Error('JwtGuard not implemented');
  }
}
