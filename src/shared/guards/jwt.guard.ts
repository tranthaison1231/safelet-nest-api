import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err, user, info) {
    console.log(err);
    if (err || !user) {
      if (info) {
        throw new UnauthorizedException(
          {
            cause: err,
          },
          info.message,
        );
      }
      throw new UnauthorizedException(
        {
          cause: err,
        },
        'Unauthorized',
      );
    }
    return user;
  }
}
