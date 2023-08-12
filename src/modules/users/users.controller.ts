import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { PaginationRequestDto } from 'src/shared/utils/validators';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/shared/guards/jwt.guard';
@ApiBearerAuth()
@ApiTags('User')
@Controller('/users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() query: PaginationRequestDto) {
    return this.usersService.findAll(query.page, query.limit);
  }

  @Get(':userID/events')
  getEvents(): string {
    return this.usersService.getEvents();
  }
}
