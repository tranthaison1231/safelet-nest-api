import { CanActivate, ExecutionContext, mixin, Type } from '@nestjs/common';
import { UserPermission } from 'src/modules/roles/schemas/permissions.schema';
import { User } from 'src/modules/users/schemas/users.schema';

interface RequestWithUser {
  user: User;
}

const RoleGuard = (checkPermissions: UserPermission[]): Type<CanActivate> => {
  class RoleGuardMixin implements CanActivate {
    canActivate(context: ExecutionContext) {
      const request = context.switchToHttp().getRequest<RequestWithUser>();
      const user = request.user;
      console.log(user);
      const permissions = user?.roles
        .map((role) => role.permissions.map((permission) => permission.name))
        .flat();
      return permissions.some((permission) =>
        checkPermissions.includes(permission),
      );
    }
  }

  return mixin(RoleGuardMixin);
};

export default RoleGuard;
