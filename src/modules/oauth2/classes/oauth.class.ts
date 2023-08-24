import { randomBytes } from 'crypto';
import { AuthorizationCode } from 'simple-oauth2';
import { OAuthProvidersEnum } from '../../users/enums/oauth-providers.enum';

export interface IProvider {
  readonly tokenHost: string;
  readonly tokenPath: string;
  readonly authorizeHost: string;
  readonly authorizePath: string;
  readonly refreshPath?: string;
  readonly revokePath?: string;
}

export interface IAuthParams {
  readonly redirect_uri: string;
  readonly scope: string | string[];
  readonly state: string;
}

export interface IClient {
  readonly id: string;
  readonly secret: string;
  readonly secretParamName?: string | undefined;
  readonly idParamName?: string | undefined;
}

const OAuthProviders: Record<OAuthProvidersEnum, IProvider> = {
  [OAuthProvidersEnum.GOOGLE]: {
    authorizeHost: 'https://accounts.google.com',
    authorizePath: '/o/oauth2/v2/auth',
    tokenHost: 'https://www.googleapis.com',
    tokenPath: '/oauth2/v4/token',
  },
  [OAuthProvidersEnum.FACEBOOK]: {
    authorizeHost: 'https://facebook.com',
    authorizePath: '/v9.0/dialog/oauth',
    tokenHost: 'https://graph.facebook.com',
    tokenPath: '/v9.0/oauth/access_token',
  },
  [OAuthProvidersEnum.GITHUB]: {
    authorizeHost: 'https://github.com',
    authorizePath: '/login/oauth/authorize',
    tokenHost: 'https://github.com',
    tokenPath: '/login/oauth/access_token',
  },
  [OAuthProvidersEnum.MICROSOFT]: {
    authorizeHost: 'https://login.microsoftonline.com',
    authorizePath: '/common/oauth2/v2.0/authorize',
    tokenHost: 'https://login.microsoftonline.com',
    tokenPath: '/common/oauth2/v2.0/token',
  },
};

export class OAuthClass {
  private static userDataUrls: Record<OAuthProvidersEnum, string> = {
    [OAuthProvidersEnum.GOOGLE]:
      'https://www.googleapis.com/oauth2/v3/userinfo',
    [OAuthProvidersEnum.MICROSOFT]: 'https://graph.microsoft.com/v1.0/me',
    [OAuthProvidersEnum.FACEBOOK]:
      'https://graph.facebook.com/v16.0/me?fields=email,name',
    [OAuthProvidersEnum.GITHUB]: 'https://api.github.com/user',
  };

  private readonly code: AuthorizationCode;
  private readonly authorization: IAuthParams;
  private readonly userDataUrl: string;

  constructor(
    private readonly provider: OAuthProvidersEnum,
    private readonly client: IClient,
    private readonly url: string,
  ) {
    this.code = new AuthorizationCode({
      client,
      auth: OAuthProviders[provider],
    });
    this.authorization = this.genAuthorization(provider, url);
    this.userDataUrl = OAuthClass.userDataUrls[provider];
  }

  public get state(): string {
    return this.authorization.state;
  }

  private genAuthorization(
    provider: OAuthProvidersEnum,
    url: string,
  ): IAuthParams {
    const redirect_uri = `${url}/api/auth/ext/${provider}/callback`;
    const state = randomBytes(16).toString('hex');

    switch (provider) {
      case OAuthProvidersEnum.GOOGLE:
        return {
          state,
          redirect_uri,
          scope: [
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile',
          ],
        };
      case OAuthProvidersEnum.MICROSOFT:
        return {
          state,
          redirect_uri,
          scope: ['openid', 'profile', 'email'],
        };
      case OAuthProvidersEnum.FACEBOOK:
        return {
          state,
          redirect_uri,
          scope: ['email', 'public_profile'],
        };
      case OAuthProvidersEnum.GITHUB:
        return {
          state,
          redirect_uri,
          scope: ['user:email', 'read:user'],
        };
    }
  }

  public get dataUrl(): string {
    return this.userDataUrl;
  }

  public get authorizationUrl(): string {
    return this.code.authorizeURL(this.authorization);
  }

  public async getToken(code: string) {
    const result = await this.code.getToken({
      code,
      redirect_uri: this.authorization.redirect_uri,
      scope: this.authorization.scope,
    });
    return result.token.access_token;
  }
}
