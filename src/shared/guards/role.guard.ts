import { CanActivate, ExecutionContext, mixin, Type } from '@nestjs/common';
import type { UserPermission } from '@prisma/client';
import { UsersService } from 'src/modules/users/users.service';

interface RequestWithUser {
  user: Awaited<ReturnType<UsersService['findOneById']>>;
}

const RoleGuard = (checkPermissions: UserPermission[]): Type<CanActivate> => {
  class RoleGuardMixin implements CanActivate {
    canActivate(context: ExecutionContext) {
      const request = context.switchToHttp().getRequest<RequestWithUser>();
      const user = request.user;
      const permissions = user?.roles
        .map((role) => role.permissions.map((permission) => permission.name))
        .flat();
      return checkPermissions.some((permission) =>
        permissions.includes(permission),
      );
    }
  }

  return mixin(RoleGuardMixin);
};

export default RoleGuard;
