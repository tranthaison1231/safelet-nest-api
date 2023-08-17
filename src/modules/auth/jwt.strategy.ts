import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { User } from '../users/schemas/users.schema';
import { UsersService } from './../users/users.service';

export interface JwtPayload {
  userId: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private usersService: UsersService,
    private configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate({ userId }: JwtPayload): Promise<User> {
    console.log('userId', userId);
    const user = await this.usersService.findOneById(userId);
    if (!user) {
      throw new UnauthorizedException('Email or password is incorrect.');
    }
    return user;
  }
}
