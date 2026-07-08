import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotImplementedException,
} from '@nestjs/common';

@Injectable()
export class JwtGuard implements CanActivate {
  // TODO: Validate app-issued JWT signature + expiry
  public canActivate(_context: ExecutionContext): boolean {
    throw new NotImplementedException('JwtGuard not implemented');
  }
}
