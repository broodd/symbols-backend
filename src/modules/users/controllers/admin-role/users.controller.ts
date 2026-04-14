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
  Put,
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
import { SocketsService } from 'src/modules/sockets/services';
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
  constructor(
    private readonly usersService: UsersService,
    private readonly socketsService: SocketsService,
  ) {}

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
   * Disconnect all active sockets of client
   * @param conditions
   */
  @Put(':id/disable-socket')
  public async disableSocket(@Param() conditions: ID): Promise<{ disconnected: number }> {
    const disconnected = this.socketsService.disconnectMany(conditions.id);
    return { disconnected };
  }

  /**
   * [description]
   * @param conditions
   */
  @Delete(':id')
  public async deleteOne(@Param() conditions: ID): Promise<UserEntity> {
    this.socketsService.disconnectMany(conditions.id);
    return this.usersService.deleteOne(conditions);
  }
}
