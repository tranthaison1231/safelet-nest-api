import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export enum UserRole {
  user = 'user',
  admin = 'admin',
}

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {
  @Prop({
    required: true,
    type: String,
  })
  firstName: string;

  @Prop({
    required: true,
    type: String,
  })
  lastName: string;

  @Prop({
    required: true,
    unique: true,
    type: String,
  })
  email: string;

  @Prop()
  phoneNumber: string;

  @Prop({
    required: true,
    type: String,
  })
  password: string;

  @Prop()
  salt: string;

  @Prop({
    default: false,
  })
  isVerified: boolean;

  avatarURL: string;

  @Prop({
    type: String,
    enum: [UserRole.admin, UserRole.user],
    default: UserRole.user,
  })
  role: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.set('toJSON', {
  transform: function (_doc, ret) {
    delete ret.password;
    delete ret.salt;
    return ret;
  },
});
