import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class JwtGuard implements CanActivate {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public canActivate(context: ExecutionContext): boolean {
    // TODO: Validate app-issued JWT signature + expiry
    return true;
  }
}
