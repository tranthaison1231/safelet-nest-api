import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PermissionDocument = HydratedDocument<Permission>;

export enum UserPermission {
  GET_USERS = 'GET_USERS',
}

@Schema()
export class Permission {
  @Prop({
    required: true,
    type: String,
  })
  name: UserPermission;
}

export const PermissionSchema = SchemaFactory.createForClass(Permission);
