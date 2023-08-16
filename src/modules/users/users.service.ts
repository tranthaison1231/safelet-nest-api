import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/users.schema';
import { SignInDto, SignUpDto } from '../auth/dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { comparePassword, hashPassword } from 'src/shared/utils/password';
import { ERROR_CODE } from 'src/shared/constants/error-code';
import { OAuthProvidersEnum } from './enums/oauth-providers.enum';
import { OAuthProvider } from './schemas/oauth_providers.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(OAuthProvider.name)
    private readonly oauthProviderModel: Model<OAuthProvider>,
  ) {}

  getEvents(): string {
    return 'Hello Events!';
  }

  async findAll(page = 1, limit = 10) {
    try {
      const items = await this.userModel
        .find()
        .skip((page - 1) * limit)
        .limit(limit)
        .exec();
      const total = await this.userModel.countDocuments().exec();
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
      const body: Partial<UserDocument> = signUpDto;
      const salt = await bcrypt.genSalt();

      body.password = await hashPassword(signUpDto.password, salt);
      body.salt = salt;

      const user = await this.userModel.create(body);
      return user;
    } catch (error) {
      if (error.code === ERROR_CODE.CONFLICT) {
        throw new ConflictException('Email already exists');
      } else {
        throw new InternalServerErrorException(error);
      }
    }
  }

  async validateUserPassword({ email, password }: SignInDto) {
    const user = await this.userModel
      .findOne({
        email: email,
      })
      .exec();
    if (user && (await comparePassword(password, user.password))) {
      return user.id;
    }
    return null;
  }

  async findOneByEmail(email: string): Promise<UserDocument> {
    return this.userModel
      .findOne({
        email: email,
      })
      .exec();
  }

  async findOneById(userID: string): Promise<UserDocument> {
    return this.userModel
      .findOne({
        _id: userID,
      })
      .exec();
  }

  public async findOrCreate(
    provider: OAuthProvidersEnum,
    providerId: string,
    email: string,
    name: string,
  ) {
    const user = await this.userModel
      .findOne({
        email: email,
      })
      .populate('oauthProviders');
    if (!user) {
      const createdProvider = await this.oauthProviderModel.create({
        providerName: provider,
        providerId: providerId,
      });
      const user = this.userModel.create({
        email: email,
        firstName: name.split(' ')[0],
        lastName: name.split(' ')[1],
        password: 'UNSET',
        salt: 'UNSET',
        isVerified: true,
        oauthProviders: [createdProvider._id],
      });
      return user;
    }
    if (
      !user.oauthProviders?.find((oauth) => oauth.providerName === provider)
    ) {
      const createdProvider = await this.oauthProviderModel.create({
        providerName: provider,
        providerId: providerId,
      });
      user.oauthProviders.push(createdProvider._id);
      await user.save();
    }
    return user;
  }
}
