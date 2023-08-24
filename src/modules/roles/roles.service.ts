import { Injectable } from '@nestjs/common';
import { Role } from './schemas/roles.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class RolesService {
  constructor(
    @InjectModel(Role.name) private readonly roleModel: Model<Role>,
  ) {}

  getRoles(): Promise<string[]> {
    return this.roleModel.find();
  }
}
