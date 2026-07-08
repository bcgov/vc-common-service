import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotImplementedException,
} from '@nestjs/common';

@Injectable()
export class ScopeGuard implements CanActivate {
  // TODO: Check scopes in JWT match required endpoint scope
  public canActivate(_context: ExecutionContext): boolean {
    throw new NotImplementedException('ScopeGuard not implemented');
  }
}
