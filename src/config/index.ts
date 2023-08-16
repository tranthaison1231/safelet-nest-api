import { IClient } from 'src/shared/guards/oauth-flag.guard';

export interface IOAuth2 {
  readonly microsoft: IClient | null;
  readonly google: IClient | null;
  readonly facebook: IClient | null;
  readonly github: IClient | null;
}

export interface IConfig {
  readonly oauth2: IOAuth2;
}

export function config(): IConfig {
  return {
    oauth2: {
      microsoft:
        process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET
          ? {
              id: process.env.MICROSOFT_CLIENT_ID,
              secret: process.env.MICROSOFT_CLIENT_SECRET,
            }
          : null,
      google:
        process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
          ? {
              id: process.env.GOOGLE_CLIENT_ID,
              secret: process.env.GOOGLE_CLIENT_SECRET,
            }
          : null,
      facebook:
        process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET
          ? {
              id: process.env.FACEBOOK_CLIENT_ID,
              secret: process.env.FACEBOOK_CLIENT_SECRET,
            }
          : null,
      github:
        process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
          ? {
              id: process.env.GITHUB_CLIENT_ID,
              secret: process.env.GITHUB_CLIENT_SECRET,
            }
          : null,
    },
  };
}
