import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuthProvidersEnum } from '../users/enums/oauth-providers.enum';
import { IClient, OAuthClass } from './classes/oauth.class';
import { ICallbackQuery } from './dtos/callback-query.dto';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';
import { UsersService } from '../users/users.service';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class Oauth2Service {
  private readonly [OAuthProvidersEnum.MICROSOFT]: OAuthClass | null;
  private readonly [OAuthProvidersEnum.GOOGLE]: OAuthClass | null;
  private readonly [OAuthProvidersEnum.FACEBOOK]: OAuthClass | null;
  private readonly [OAuthProvidersEnum.GITHUB]: OAuthClass | null;

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly httpService: HttpService,
    private readonly authService: AuthService,
  ) {
    const url = this.configService.get<string>('URL');
    this[OAuthProvidersEnum.MICROSOFT] = Oauth2Service.setOAuthClass(
      OAuthProvidersEnum.MICROSOFT,
      configService,
      url,
    );
    this[OAuthProvidersEnum.GOOGLE] = Oauth2Service.setOAuthClass(
      OAuthProvidersEnum.GOOGLE,
      configService,
      url,
    );
    this[OAuthProvidersEnum.FACEBOOK] = Oauth2Service.setOAuthClass(
      OAuthProvidersEnum.FACEBOOK,
      configService,
      url,
    );
    this[OAuthProvidersEnum.GITHUB] = Oauth2Service.setOAuthClass(
      OAuthProvidersEnum.GITHUB,
      configService,
      url,
    );
  }

  private static setOAuthClass(
    provider: OAuthProvidersEnum,
    configService: ConfigService,
    url: string,
  ): OAuthClass | null {
    const client = configService.get<IClient | null>(
      `oauth2.${provider.toLowerCase()}`,
    );

    if (!client) {
      return null;
    }

    return new OAuthClass(provider, client, url);
  }

  private getOAuth(provider: OAuthProvidersEnum): OAuthClass {
    const oauth = this[provider];
    if (!oauth) {
      throw new NotFoundException('Page not found');
    }

    return oauth;
  }

  public async login(
    provider: OAuthProvidersEnum,
    providerId: string,
    email: string,
    name: string,
  ) {
    const user = await this.usersService.findOrCreate(
      provider,
      providerId,
      email,
      name,
    );
    return await this.authService.createToken(user.id);
  }

  public getAuthorizationUrl(provider: OAuthProvidersEnum): string {
    return this.getOAuth(provider).authorizationUrl;
  }

  private async getAccessToken(
    provider: OAuthProvidersEnum,
    code: string,
    state: string,
  ): Promise<string> {
    const oauth = this.getOAuth(provider);
    if (state !== oauth.state) {
      throw new UnauthorizedException('Corrupted state');
    }
    try {
      return await oauth.getToken(code);
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  public async getUserData<T extends Record<string, any>>(
    provider: OAuthProvidersEnum,
    cbQuery: ICallbackQuery,
  ) {
    const { code, state } = cbQuery;
    const accessToken = await this.getAccessToken(provider, code, state);
    const userData = await firstValueFrom(
      this.httpService
        .get<T>(this.getOAuth(provider).dataUrl, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        })
        .pipe(
          catchError((error: AxiosError) => {
            throw new UnauthorizedException(error.response.data);
          }),
        ),
    );
    return userData.data;
  }
}
