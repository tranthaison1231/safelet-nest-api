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

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
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
}
