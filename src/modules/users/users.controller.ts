import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/shared/guards/jwt.guard';
import { PaginationRequestDto } from 'src/shared/utils/validators';
import { UsersService } from './users.service';
import RoleGuard from 'src/shared/guards/role.guard';

@ApiBearerAuth()
@ApiTags('User')
@Controller('/users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard(['GET_USERS']))
  async findAll(@Query() query: PaginationRequestDto) {
    return this.usersService.findAll(query.page, query.limit);
  }
}
