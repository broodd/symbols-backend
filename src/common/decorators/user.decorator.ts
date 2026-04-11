import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { UserEntity } from 'src/modules/users/entities';

/**
 * [description]
 */
export const ReqUser = createParamDecorator((data: string, ctx: ExecutionContext): UserEntity => {
  const request = ctx.switchToHttp().getRequest();
  return data ? request.user && request.user[data] : request.user;
});
