import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { MailerService } from '@nestjs-modules/mailer';
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import Redis from 'ioredis';
import { EXPIRES_IN } from 'src/shared/constants/error-code';
import { comparePassword, hashPassword } from 'src/shared/utils/password';
import { generateOpaqueToken } from 'src/shared/utils/token';
import { uuid } from 'src/shared/utils/uuid';
import { UsersService } from '../users/users.service';
import { CreateToken } from './auth.interface';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  SignInDto,
  SignUpDto,
} from './dto/auth.dto';
import { TokenPayloadDto } from './dto/token-payload.dto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'nestjs-prisma';
import { User } from '@prisma/client';

export const ACCESS_TOKEN_EXPIRE_IN = 60;
export const REFRESH_TOKEN_EXPIRE_IN = 60 * 60 * 24 * 30;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private usersService: UsersService,
    private mailService: MailerService,
    private configService: ConfigService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async signUp(signUpDto: SignUpDto) {
    const user = await this.usersService.signUp(signUpDto);
    return user;
  }

  async createRefreshToken({ userId }: { userId: string }) {
    const refreshToken = generateOpaqueToken();
    await this.redis.set(
      `refresh-token:${userId}`,
      refreshToken,
      'EX',
      REFRESH_TOKEN_EXPIRE_IN,
    );
    return refreshToken;
  }

  async createToken({ userId }: CreateToken): Promise<TokenPayloadDto> {
    const accessToken = await this.jwtService.sign({ userId });
    const refreshToken = await this.createRefreshToken({
      userId: userId,
    });
    return new TokenPayloadDto({
      tokenType: 'Bearer',
      expiresIn: EXPIRES_IN,
      accessToken,
      refreshToken,
    });
  }

  async signIn(signInDto: SignInDto) {
    const userId = await this.usersService.validateUserPassword(signInDto);
    if (!userId) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.createToken({ userId });
  }
  async sendEmailVerification({
    email,
    token,
    code,
  }: {
    email: string;
    token: string;
    code: string;
  }) {
    try {
      await this.mailService.sendMail({
        to: email,
        subject: 'Verify Email',
        html: `<p>Click <a href="${this.configService.get(
          'CLIENT_URL',
        )}/verify-email?token=${token}&code=${code}">here</a> to verify your email.</p>`,
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async forgotPassword({ email }: ForgotPasswordDto) {
    try {
      const user = await this.usersService.findOneByEmail(email);
      if (!user) throw new NotFoundException('User not found');
      const token = await this.createToken({ userId: user.id.toString() });
      await this.mailService.sendMail({
        to: user.email,
        subject: 'Reset Password',
        html: `<p>Click <a href="${this.configService.get(
          'CLIENT_URL',
        )}/reset-password?token=${token}">here</a> to reset your password.</p>`,
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async verifyEmail(user: User) {
    try {
      if (user.isVerified)
        throw new UnauthorizedException('User already verified');
      const token = await this.createToken({ userId: user.id.toString() });
      const code = uuid();
      await this.redis.set(`verify-email:${user.id}`, code, 'EX', 60 * 60 * 24);
      await this.sendEmailVerification({
        email: user.email,
        token: token.accessToken,
        code,
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async confirmEmail(user: User, code: string) {
    try {
      const redisCode = await this.redis.get(`verify-email:${user.id}`);
      if (redisCode !== code) throw new UnauthorizedException('Invalid code');
      user.isVerified = true;
      this.redis.del(`verify-email:${user.id}`);
      this.prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          isVerified: true,
        },
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async logout(user: User) {
    try {
      this.redis.del(`jwt-secret:${user.id}`);
      this.redis.del(`refresh-token:${user.id}`);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async refreshToken(refreshToken: string, userID: string) {
    const redisRefreshToken = await this.redis.get(`refresh-token:${userID}`);
    if (redisRefreshToken !== refreshToken)
      throw new UnauthorizedException('Invalid refresh token');
    const token = await this.createToken({ userId: userID.toString() });
    return token;
  }

  async changePassword(
    { newPassword, password }: ChangePasswordDto,
    user: User,
  ) {
    try {
      const isMatch = await comparePassword(password, user.password);
      if (!isMatch) throw new UnauthorizedException('Password does not match');
      if (user.password === newPassword)
        throw new UnauthorizedException(
          'New password must be different from old password',
        );
      const salt = await bcrypt.genSalt();

      this.prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          password: await hashPassword(newPassword, salt),
        },
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
