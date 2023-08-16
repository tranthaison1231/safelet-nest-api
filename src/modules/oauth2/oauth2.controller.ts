import {
  Controller,
  Get,
  HttpStatus,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiNotFoundResponse, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { OAuthFlagGuard } from 'src/shared/guards/oauth-flag.guard';
import { OAuthProvidersEnum } from '../users/enums/oauth-providers.enum';
import { Oauth2Service } from './oauth2.service';
import { CallbackQueryDto } from './dtos/callback-query.dto';
import {
  IFacebookUser,
  IGitHubUser,
  IGoogleUser,
} from './interfaces/user-response.interface';
import { ConfigService } from '@nestjs/config';

@Controller('/auth/ext')
@ApiTags('OAuth2')
export class OAuth2Controller {
  constructor(
    private readonly oauth2Service: Oauth2Service,
    private readonly configService: ConfigService,
  ) {}

  @UseGuards(OAuthFlagGuard(OAuthProvidersEnum.GOOGLE))
  @Get('google')
  @ApiResponse({
    description: 'Redirects to Google OAuth2 login page',
    status: HttpStatus.TEMPORARY_REDIRECT,
  })
  @ApiNotFoundResponse({
    description: 'OAuth2 is not enabled for Google',
  })
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

  private startRedirect(res: Response, provider: OAuthProvidersEnum) {
    return res
      .status(HttpStatus.TEMPORARY_REDIRECT)
      .redirect(this.oauth2Service.getAuthorizationUrl(provider));
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
    const webUrl = this.configService.get<string>('WEB_URL');
    return res
      .status(HttpStatus.PERMANENT_REDIRECT)
      .redirect(
        `${webUrl}/?access_token=${data.accessToken}&refresh_token=${data.refreshToken}`,
      );
  }
}
