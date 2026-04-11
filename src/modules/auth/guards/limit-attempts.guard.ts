import { Cache } from 'cache-manager';

import {
  ForbiddenException,
  ExecutionContext,
  CanActivate,
  Injectable,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Reflector } from '@nestjs/core';

import { LimitAttemptsOptions, LIMIT_ATTEMPTS_KEY } from 'src/common/decorators';
import { ErrorTypeEnum } from 'src/common/enums';

import { CACHE_LIMIT_PREFIX } from '../auth.constants';

@Injectable()
export class LimitAttemptsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const limitMeta = this.reflector.get<LimitAttemptsOptions>(
      LIMIT_ATTEMPTS_KEY,
      context.getHandler(),
    );
    if (!limitMeta) return true;

    const req = context.switchToHttp().getRequest();

    const name = limitMeta.name ? limitMeta.name : context.getHandler().name;
    if (!limitMeta.identifier) return true;
    const identifier = limitMeta.identifier(req);
    if (!identifier) return true;

    const key = `${CACHE_LIMIT_PREFIX}${identifier}:${name}`;

    const attempts = (await this.cacheManager.get<number>(key)) || 0;
    if (attempts >= limitMeta.maxAttempts) {
      throw new ForbiddenException(ErrorTypeEnum.TOO_MANY_REQUESTS);
    }

    await this.cacheManager.set(key, attempts + 1, limitMeta.ttlSeconds * 1000);
    return true;
  }
}
