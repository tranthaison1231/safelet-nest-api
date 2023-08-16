import {
  CanActivate,
  ExecutionContext,
  Injectable,
  mixin,
  NotFoundException,
  Type,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { OAuthProvidersEnum } from 'src/modules/users/enums/oauth-providers.enum';

export interface IClient {
  readonly id: string;
  readonly secret: string;
  readonly secretParamName?: string | undefined;
  readonly idParamName?: string | undefined;
}

export const OAuthFlagGuard = (
  provider: OAuthProvidersEnum,
): Type<CanActivate> => {
  @Injectable()
  class OAuthFlagGuardClass implements CanActivate {
    constructor(private readonly configService: ConfigService) {}

    public canActivate(context: ExecutionContext): boolean {
      const client = this.configService.get<IClient | null>(
        `oauth2.${provider}`,
      );

      if (!client) {
        const request = context.switchToHttp().getRequest<Request>();
        throw new NotFoundException(`Cannot ${request.method} ${request.url}`);
      }

      return true;
    }
  }

  return mixin(OAuthFlagGuardClass);
};
