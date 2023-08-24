import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UsersService } from 'src/modules/users/users.service';

export const GetUser = createParamDecorator(
  (
    _data: unknown,
    ctx: ExecutionContext,
  ): Awaited<ReturnType<UsersService['findOneById']>> => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
