import {
  HttpExceptionOptions,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<User>(
    err: Error,
    user: User,
    info: { message: string | HttpExceptionOptions },
  ) {
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
