import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { OAuth2Controller } from './oauth2.controller';
import { Oauth2Service } from './oauth2.service';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  controllers: [OAuth2Controller],
  providers: [Oauth2Service],
})
export class OAuth2Module {}
