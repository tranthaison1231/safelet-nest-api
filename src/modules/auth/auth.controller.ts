import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { GetUser } from 'src/shared/decorators/user.decorator';
import { JwtAuthGuard } from 'src/shared/guards/jwt.guard';
import { UserDocument } from '../users/schemas/users.schema';
import { AuthService, REFRESH_TOKEN_EXPIRE_IN } from './auth.service';
import {
  ChangePasswordDto,
  ConfirmEmailDto,
  ForgotPasswordDto,
  SignInDto,
  SignUpDto,
} from './dto/auth.dto';
import { TokenPayloadDto } from './dto/token-payload.dto';

@Controller()
@ApiTags('Auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/sign-up')
  @HttpCode(HttpStatus.CREATED)
  signUp(@Body(ValidationPipe) signUpDto: SignUpDto) {
    return this.authService.signUp(signUpDto);
  }

  @Post('/sign-in')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: TokenPayloadDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials',
  })
  async signIn(
    @Body(ValidationPipe) signInDto: SignInDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<TokenPayloadDto> {
    const data = await this.authService.signIn(signInDto);
    response.cookie('refreshToken', data.refreshToken, {
      maxAge: REFRESH_TOKEN_EXPIRE_IN * 1000,
      sameSite: 'none',
      httpOnly: true,
      secure: true,
      path: '/api/refresh-token',
    });
    return data;
  }

  @Post('/forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body(ValidationPipe) forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Put('/verify-email')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  verifyEmail(@GetUser() user: UserDocument) {
    return this.authService.verifyEmail(user);
  }

  @Put('/confirm-email')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  confirmEmail(
    @GetUser() user: UserDocument,
    @Body(ValidationPipe) confirmEmailDto: ConfirmEmailDto,
  ) {
    return this.authService.confirmEmail(user, confirmEmailDto.code);
  }

  @Put('/refresh-token')
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const jwtObject = jwt.decode(token) as { userId: string };
    const userID = jwtObject?.userId;
    const refreshToken = req.cookies.refreshToken;
    if (!userID || !refreshToken)
      throw new UnauthorizedException('Invalid token');
    const data = await this.authService.refreshToken(
      refreshToken,
      userID as string,
    );
    response.cookie('refreshToken', data.refreshToken, {
      maxAge: REFRESH_TOKEN_EXPIRE_IN * 1000,
      sameSite: 'none',
      httpOnly: true,
      secure: true,
      path: '/api/refresh-token',
    });
    return data;
  }

  @Put('/change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  changePassword(
    @GetUser() user: UserDocument,
    @Body(ValidationPipe) changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(changePasswordDto, user);
  }

  @Put('/logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@GetUser() user: UserDocument) {
    await this.authService.logout(user);
    return {
      message: 'Logout successfully',
    };
  }

  @Get('/profile')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async profile(@GetUser() user: UserDocument) {
    return user;
  }
}
