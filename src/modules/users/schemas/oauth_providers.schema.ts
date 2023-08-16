import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';
import { OAuthProvidersEnum } from '../enums/oauth-providers.enum';

export type UserDocument = HydratedDocument<OAuthProvider>;

@Schema()
export class OAuthProvider extends Document {
  @Prop({
    required: true,
    type: String,
    enum: Object.values(OAuthProvidersEnum),
  })
  providerName: string;

  @Prop({
    required: true,
    type: String,
  })
  providerId: string;
}

export const OAuthProviderSchema = SchemaFactory.createForClass(OAuthProvider);
