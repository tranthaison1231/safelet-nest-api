import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PaginationRequestDto {
  @ApiProperty({
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiProperty({
    maximum: 100,
  })
  @Type(() => Number)
  @IsInt()
  @Max(100)
  @IsOptional()
  limit?: number;
}
