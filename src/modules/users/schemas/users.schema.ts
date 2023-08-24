import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { OAuthProvider } from './oauth_providers.schema';
import { Role } from 'src/modules/roles/schemas/roles.schema';

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
    type: [Types.ObjectId],
    ref: Role.name,
    default: [],
  })
  roles: Role[];

  @Prop({
    type: [Types.ObjectId],
    ref: OAuthProvider.name,
    default: [],
  })
  oauthProviders: OAuthProvider[];
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.set('toJSON', {
  transform: function (_doc, ret) {
    delete ret.password;
    delete ret.salt;
    return ret;
  },
});
