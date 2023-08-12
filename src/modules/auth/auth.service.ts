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
import { UserDocument } from '../users/schemas/users.schema';
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

export const ACCESS_TOKEN_EXPIRE_IN = 60;
export const REFRESH_TOKEN_EXPIRE_IN = 60 * 60 * 24 * 30;

@Injectable()
export class AuthService {
  constructor(
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
    code;
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
      const token = await this.createToken({ userId: user._id.toString() });
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

  async verifyEmail(user: UserDocument) {
    try {
      if (user.isVerified)
        throw new UnauthorizedException('User already verified');
      const token = await this.createToken({ userId: user._id.toString() });
      const code = uuid();
      await this.redis.set(
        `verify-email:${user._id}`,
        code,
        'EX',
        60 * 60 * 24,
      );
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

  async confirmEmail(user: UserDocument, code: string) {
    try {
      const redisCode = await this.redis.get(`verify-email:${user._id}`);
      if (redisCode !== code) throw new UnauthorizedException('Invalid code');
      user.isVerified = true;
      this.redis.del(`verify-email:${user._id}`);
      await user.save();
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async logout(user: UserDocument) {
    try {
      this.redis.del(`jwt-secret:${user._id}`);
      this.redis.del(`refresh-token:${user._id}`);
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
    user: UserDocument,
  ) {
    try {
      const isMatch = await comparePassword(password, user.password);
      if (!isMatch) throw new UnauthorizedException('Password does not match');
      if (user.password === newPassword)
        throw new UnauthorizedException(
          'New password must be different from old password',
        );
      const salt = await bcrypt.genSalt();

      user.password = await hashPassword(newPassword, salt);
      return user.save();
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
