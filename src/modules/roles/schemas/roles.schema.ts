import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Permission } from './permissions.schema';

export type RoleDocument = HydratedDocument<Role>;

export enum UserRole {
  user = 'user',
  admin = 'admin',
}

@Schema()
export class Role {
  @Prop({
    required: true,
    type: String,
    enum: [UserRole.admin, UserRole.user],
  })
  name: string;

  @Prop({
    required: true,
    type: String,
  })
  description: string;

  @Prop({
    required: true,
    type: [Types.ObjectId],
    ref: Permission.name,
  })
  permissions: Permission[];
}

export const RoleSchema = SchemaFactory.createForClass(Role);
