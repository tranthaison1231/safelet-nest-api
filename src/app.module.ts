import { ConfigModule, ConfigService } from '@nestjs/config';
import { Logger, Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import { PrismaModule, loggingMiddleware } from 'nestjs-prisma';
import { S3ManagerModule } from './modules/common/s3/s3.module';
import { AwsSdkModule } from 'aws-sdk-v3-nest';
import { S3Client } from '@aws-sdk/client-s3';
import { OAuth2Module } from './modules/oauth2/oauth2.module';
import { config } from './config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
    }),
    PrismaModule.forRoot({
      isGlobal: true,
      prismaServiceOptions: {
        middlewares: [
          loggingMiddleware({
            logger: new Logger('PrismaMiddleware'),
            logLevel: 'log',
          }),
        ],
      },
    }),
    UsersModule,
    AuthModule,
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        return {
          config: {
            host: configService.get('REDIS_HOST'),
            port: configService.get('REDIS_PORT'),
            password: configService.get('REDIS_PASSWORD'),
          },
        };
      },
      inject: [ConfigService],
    }),
    AwsSdkModule.registerAsync({
      imports: [ConfigModule],
      isGlobal: true,
      clientType: S3Client,
      useFactory: async (configService: ConfigService) => {
        return new S3Client({
          region: configService.get('AWS_REGION'),
          credentials: {
            accessKeyId: configService.get('AWS_ACCESS_KEY_ID'),
            secretAccessKey: configService.get('AWS_SECRET_ACCESS_KEY'),
          },
        });
      },
      inject: [ConfigService],
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        return {
          transport: configService.get('MAIL_TRANSPORT'),
          defaults: {
            from: `"No Reply" ${configService.get('MAIL_FROM')}>`,
          },
        };
      },
      inject: [ConfigService],
    }),
    S3ManagerModule,
    OAuth2Module,
  ],
})
export class AppModule {}
