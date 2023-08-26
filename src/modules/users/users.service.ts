import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ERROR_CODE } from 'src/shared/constants/error-code';
import { comparePassword, hashPassword } from 'src/shared/utils/password';
import { SignInDto, SignUpDto } from '../auth/dto/auth.dto';
import { OAuthProvidersEnum } from './enums/oauth-providers.enum';
import { PrismaService } from 'nestjs-prisma';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, limit = 10) {
    try {
      const items = await this.prisma.user.findMany({
        skip: (page - 1) * limit,
        take: limit,
      });
      const total = await this.prisma.user.count();
      return {
        items,
        page,
        limit,
        total,
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async signUp(signUpDto: SignUpDto) {
    try {
      const salt = await bcrypt.genSalt();

      const user = await this.prisma.user.create({
        data: {
          ...signUpDto,
          password: await hashPassword(signUpDto.password, salt),
          salt: salt,
          isVerified: false,
        },
      });
      return user;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === ERROR_CODE.CONFLICT
      ) {
        throw new ConflictException('Email already exists');
      } else {
        throw new InternalServerErrorException(error);
      }
    }
  }

  async validateUserPassword({ email, password }: SignInDto) {
    const user = await this.findOneByEmail(email);
    if (user && (await comparePassword(password, user.password))) {
      return user.id;
    }
    return null;
  }

  async findOneByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: {
        email: email,
      },
    });
  }

  async findOneById(userID: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userID,
      },
      include: {
        roles: {
          include: {
            permissions: true,
          },
        },
      },
    });
    return user;
  }

  public async findOrCreate(
    provider: OAuthProvidersEnum,
    providerId: string,
    email: string,
    name: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: email,
      },
      include: {
        oauthProviders: true,
      },
    });
    if (!user) {
      const user = await this.prisma.user.create({
        data: {
          email: email,
          firstName: name.split(' ')[0],
          lastName: name.split(' ')[1],
          password: 'UNSET',
          salt: 'UNSET',
          isVerified: true,
        },
      });
      await this.prisma.oauthProvider.create({
        data: {
          providerName: provider,
          providerId: providerId,
          userId: user.id,
        },
      });

      return user;
    }
    if (
      !user.oauthProviders?.find((oauth) => oauth.providerName === provider)
    ) {
      await this.prisma.oauthProvider.create({
        data: {
          providerName: provider,
          providerId: providerId,
          userId: user.id,
        },
      });
    }
    return user;
  }
}
