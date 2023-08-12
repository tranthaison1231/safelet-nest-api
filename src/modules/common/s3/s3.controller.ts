import {
  Body,
  Controller,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PresignedUrlDto } from './dto/s3-payload.dto';
import { S3ManagerService } from './s3.service';
import { JwtAuthGuard } from 'src/shared/guards/jwt.guard';

@ApiTags('S3')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard)
export class S3ManagerController {
  constructor(private readonly s3ManagerService: S3ManagerService) {}

  @Post('/upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          example: 'https://bucket.s3.amazonaws.com/123456789',
        },
      },
    },
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ url: string }> {
    const uploadedFile = await this.s3ManagerService.uploadFile(file);
    return uploadedFile;
  }

  @Put('/presigned-url')
  async getPresignedURL(@Body() presignedUrlDto: PresignedUrlDto) {
    return this.s3ManagerService.presignedUrlS3(presignedUrlDto);
  }
}
