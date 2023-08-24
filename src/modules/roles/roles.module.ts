import { Module } from '@nestjs/common';
import { RolesService } from './roles.service';
import { Role, RoleSchema } from './schemas/roles.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Role.name, schema: RoleSchema }]),
  ],
  providers: [RolesService],
  exports: [RolesService],
})
export class RolesModule {}
