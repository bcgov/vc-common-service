import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class ScopeGuard implements CanActivate {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public canActivate(context: ExecutionContext): boolean {
    // TODO: Check scopes in JWT match required endpoint scope
    return true;
  }
}
