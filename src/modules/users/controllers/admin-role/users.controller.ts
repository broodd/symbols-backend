import {
  Controller,
  UseGuards,
  Delete,
  Param,
  Patch,
  Query,
  Body,
  Post,
  Get,
} from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';

import { UseRole } from 'src/common/decorators';
import { ID } from 'src/common/dto';

import {
  PaginationUsersDto,
  SelectUsersDto,
  CreateUserDto,
  SelectUserDto,
  UpdateUserDto,
} from '../../dto/crud';
import { JwtAuthGuard } from 'src/modules/auth/guards';
import { UsersService } from '../../services';
import { UserEntity } from '../../entities';
import { UserRoleEnum } from '../../enums';

/**
 * [description]
 */
@UseGuards(JwtAuthGuard)
@UseRole(UserRoleEnum.ADMIN)
@ApiCookieAuth('accessToken')
@ApiTags('users/admin-role')
@Controller('admin-role/users')
export class AdminRole_UsersController {
  /**
   * [description]
   * @param usersService
   */
  constructor(private readonly usersService: UsersService) {}

  /**
   * [description]
   * @param data
   */
  @Post()
  public async createOne(@Body() data: CreateUserDto): Promise<UserEntity> {
    return this.usersService.createOne(data);
  }

  /**
   * [description]
   * @param options
   */
  @Get()
  public async selectManyAndCount(@Query() options: SelectUsersDto): Promise<PaginationUsersDto> {
    return this.usersService.selectManyAndCount(options);
  }

  /**
   * [description]
   * @param conditions
   * @param options
   */
  @Get(':id')
  public async selectOne(
    @Param() conditions: ID,
    @Query() options: SelectUserDto,
  ): Promise<UserEntity> {
    return this.usersService.selectOne(conditions, options);
  }

  /**
   * [description]
   * @param conditions
   * @param data
   */
  @Patch(':id')
  public async updateOne(
    @Param() conditions: ID,
    @Body() data: UpdateUserDto,
  ): Promise<UserEntity> {
    return this.usersService.updateOne(conditions, data);
  }

  /**
   * [description]
   * @param conditions
   */
  @Delete(':id')
  public async deleteOne(@Param() conditions: ID): Promise<UserEntity> {
    return this.usersService.deleteOne(conditions);
  }
}
