import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class PresignedUrlDto {
  @IsString()
  @ApiProperty()
  readonly fileName: string;

  @IsString()
  @ApiProperty()
  readonly type: string;

  @IsString()
  @ApiProperty()
  @IsOptional()
  readonly folderPrefix: string;
}
