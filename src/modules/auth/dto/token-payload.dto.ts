import { ApiProperty } from '@nestjs/swagger';

export class TokenPayloadDto {
  @ApiProperty({
    example: 3600,
  })
  expiresIn: number;

  @ApiProperty({
    example: 'Bearer',
  })
  tokenType: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
  })
  accessToken: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
  })
  refreshToken: string;

  constructor(data: {
    expiresIn: number;
    accessToken: string;
    tokenType: string;
    refreshToken: string;
  }) {
    this.tokenType = data.tokenType;
    this.expiresIn = data.expiresIn;
    this.accessToken = data.accessToken;
    this.refreshToken = data.refreshToken;
  }
}
