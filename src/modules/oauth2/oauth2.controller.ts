import {
  Controller,
  Get,
  HttpStatus,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiNotFoundResponse, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { OAuthProvidersEnum } from '../users/enums/oauth-providers.enum';
import { Oauth2Service } from './oauth2.service';
import { OAuthFlagGuard } from 'src/shared/guards/oauth-flag.guard';
import { CallbackQueryDto } from './dto/callback-query.dto';
import {
  IFacebookUser,
  IGitHubUser,
  IGoogleUser,
} from './interfaces/user-response.interface';
import { REFRESH_TOKEN_EXPIRE_IN } from '../auth/auth.service';

@Controller('/auth/ext')
@ApiTags('OAuth2')
export class OAuth2Controller {
  constructor(
    private readonly configService: ConfigService,
    private readonly oauth2Service: Oauth2Service,
  ) {}

  @UseGuards(OAuthFlagGuard(OAuthProvidersEnum.GOOGLE))
  @ApiResponse({
    description: 'Redirects to Google OAuth2 login page',
    status: HttpStatus.TEMPORARY_REDIRECT,
  })
  @ApiNotFoundResponse({
    description: 'OAuth2 is not enabled for Google',
  })
  @Get('google')
  public google(@Res() res: Response) {
    return this.startRedirect(res, OAuthProvidersEnum.GOOGLE);
  }

  @UseGuards(OAuthFlagGuard(OAuthProvidersEnum.GOOGLE))
  @Get('google/callback')
  @ApiResponse({
    description: 'Redirects to the frontend with the JWT token',
    status: HttpStatus.PERMANENT_REDIRECT,
  })
  @ApiNotFoundResponse({
    description: 'OAuth2 is not enabled for Google',
  })
  public async googleCallback(
    @Query() cbQuery: CallbackQueryDto,
    @Res() res: Response,
  ) {
    const provider = OAuthProvidersEnum.GOOGLE;
    const { name, email, sub } =
      await this.oauth2Service.getUserData<IGoogleUser>(provider, cbQuery);
    return this.loginAndRedirect(res, provider, sub, email, name);
  }

  @UseGuards(OAuthFlagGuard(OAuthProvidersEnum.GITHUB))
  @Get('github')
  @ApiResponse({
    description: 'Redirects to GitHub OAuth2 login page',
    status: HttpStatus.TEMPORARY_REDIRECT,
  })
  @ApiNotFoundResponse({
    description: 'OAuth2 is not enabled for GitHub',
  })
  public github(@Res() res: Response) {
    return this.startRedirect(res, OAuthProvidersEnum.GITHUB);
  }

  private startRedirect(res: Response, provider: OAuthProvidersEnum) {
    const url = this.oauth2Service.getAuthorizationUrl(provider);
    return res.status(HttpStatus.TEMPORARY_REDIRECT).redirect(url);
  }

  @UseGuards(OAuthFlagGuard(OAuthProvidersEnum.GITHUB))
  @Get('github/callback')
  @ApiResponse({
    description: 'Redirects to the frontend with the JWT token',
    status: HttpStatus.PERMANENT_REDIRECT,
  })
  @ApiNotFoundResponse({
    description: 'OAuth2 is not enabled for GitHub',
  })
  public async githubCallback(
    @Query() cbQuery: CallbackQueryDto,
    @Res() res: Response,
  ) {
    const provider = OAuthProvidersEnum.GITHUB;
    const { name, email, id } =
      await this.oauth2Service.getUserData<IGitHubUser>(provider, cbQuery);
    return this.loginAndRedirect(res, provider, id.toString(), email, name);
  }

  @UseGuards(OAuthFlagGuard(OAuthProvidersEnum.FACEBOOK))
  @Get('facebook')
  @ApiResponse({
    description: 'Redirects to Facebook OAuth2 login page',
    status: HttpStatus.TEMPORARY_REDIRECT,
  })
  @ApiNotFoundResponse({
    description: 'OAuth2 is not enabled for Facebook',
  })
  public facebook(@Res() res: Response) {
    return this.startRedirect(res, OAuthProvidersEnum.FACEBOOK);
  }

  @UseGuards(OAuthFlagGuard(OAuthProvidersEnum.FACEBOOK))
  @Get('facebook/callback')
  @ApiResponse({
    description: 'Redirects to the frontend with the JWT token',
    status: HttpStatus.PERMANENT_REDIRECT,
  })
  @ApiNotFoundResponse({
    description: 'OAuth2 is not enabled for Facebook',
  })
  public async facebookCallback(
    @Query() cbQuery: CallbackQueryDto,
    @Res() res: Response,
  ) {
    const provider = OAuthProvidersEnum.FACEBOOK;
    const { name, email, id } =
      await this.oauth2Service.getUserData<IFacebookUser>(provider, cbQuery);
    return this.loginAndRedirect(res, provider, id, email, name);
  }

  private async loginAndRedirect(
    res: Response,
    provider: OAuthProvidersEnum,
    providerId: string,
    email: string,
    name: string,
  ) {
    const data = await this.oauth2Service.login(
      provider,
      providerId,
      email,
      name,
    );
    const webUrl = this.configService.get<string>('CLIENT_URL');
    console.log(data.accessToken);
    return res
      .status(HttpStatus.PERMANENT_REDIRECT)
      .cookie('refreshToken', data.refreshToken, {
        maxAge: REFRESH_TOKEN_EXPIRE_IN * 1000,
        sameSite: 'none',
        httpOnly: true,
        secure: true,
        path: '/api/refresh-token',
      })
      .redirect(`${webUrl}/?access_token=${data.accessToken}`);
  }
}
