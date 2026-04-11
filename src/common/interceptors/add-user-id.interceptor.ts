import { Observable } from 'rxjs';

import {
  ExecutionContext,
  NestInterceptor,
  CallHandler,
  SetMetadata,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const IS_PUBLIC_KEY = 'SkipAddUserId';
export const SkipAddUserId = () => SetMetadata(IS_PUBLIC_KEY, true);

/**
 * Set query userId in GET methods
 */
@Injectable()
export class AddUserIdInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const isSkipped = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isSkipped) return next.handle();

    const request = context.switchToHttp().getRequest();
    if (request.method !== 'GET') return next.handle();

    request.query ??= {};
    request.query._userId = request.user?.id;
    request.query._role = request.user?.role;
    // Be cautious with this: improper use can lead to security issues.
    // This is override query field with request.user.id to ensure accuracy
    // as users could manually pass values that may result in unauthorized data access.

    return next.handle();
  }
}
