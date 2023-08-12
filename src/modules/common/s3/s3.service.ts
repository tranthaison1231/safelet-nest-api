import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectAws } from 'aws-sdk-v3-nest';
import { getFileName } from 'src/shared/utils/file';
import { PresignedUrlDto } from './dto/s3-payload.dto';

@Injectable()
export class S3ManagerService {
  constructor(
    @InjectAws(S3Client) private readonly s3: S3Client,
    private readonly configService: ConfigService,
  ) {}

  async uploadFile(file: Express.Multer.File) {
    const key = getFileName(file.originalname);
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.configService.get('AWS_BUCKET_NAME'),
        ContentType: file.mimetype,
        Body: file.buffer,
        Key: key,
      }),
    );
    const url = `https://${this.configService.get(
      'AWS_BUCKET_NAME',
    )}.s3.amazonaws.com/${key}`;

    return {
      url,
    };
  }

  async presignedUrlS3({ fileName, type, folderPrefix }: PresignedUrlDto) {
    try {
      const key = folderPrefix
        ? `${folderPrefix}/${getFileName(fileName)}`
        : getFileName(fileName);
      const command = new PutObjectCommand({
        Key: key,
        Bucket: this.configService.get('AWS_BUCKET_NAME'),
        ContentType: type,
        ACL: 'public-read',
      });
      const uploadUrl = await getSignedUrl(this.s3, command, {
        expiresIn: 3600,
      });

      return {
        uploadUrl,
      };
    } catch (error) {
      console.error('Error getting file with S3: ', error);
      throw new Error(error);
    }
  }

  async getFile(key: string, bucket: string) {
    try {
      const response = await this.s3.send(
        new GetObjectCommand({ Key: key, Bucket: bucket }),
      );
      const str = await response.Body.transformToString();

      return str;
    } catch (error) {
      console.error('Error getting file with S3: ', error);
      throw new Error(error);
    }
  }
}
