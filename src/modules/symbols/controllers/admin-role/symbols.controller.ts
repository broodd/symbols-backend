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
  PaginationSymbolsDto,
  SelectSymbolsDto,
  CreateSymbolDto,
  SelectSymbolDto,
  UpdateSymbolDto,
} from '../../dto/crud';
import { JwtAuthGuard } from 'src/modules/auth/guards';
import { UserRoleEnum } from 'src/modules/users/enums';
import { SymbolsService } from '../../services';
import { SymbolEntity } from '../../entities';

/**
 * [description]
 */
@UseGuards(JwtAuthGuard)
@UseRole(UserRoleEnum.ADMIN)
@ApiCookieAuth('accessToken')
@ApiTags('symbols/admin-role')
@Controller('admin-role/symbols')
export class AdminRole_SymbolsController {
  /**
   * [description]
   * @param symbolsService
   */
  constructor(private readonly symbolsService: SymbolsService) {}

  /**
   * [description]
   * @param data
   */
  @Post()
  public async createOne(@Body() data: CreateSymbolDto): Promise<SymbolEntity> {
    return this.symbolsService.createOne(data);
  }

  /**
   * [description]
   * @param options
   */
  @Get()
  public async selectManyAndCount(
    @Query() options: SelectSymbolsDto,
  ): Promise<PaginationSymbolsDto> {
    return this.symbolsService.selectManyAndCount(options);
  }

  /**
   * [description]
   * @param conditions
   * @param options
   */
  @Get(':id')
  public async selectOne(
    @Param() conditions: ID,
    @Query() options: SelectSymbolDto,
  ): Promise<SymbolEntity> {
    return this.symbolsService.selectOne(conditions, options);
  }

  /**
   * [description]
   * @param conditions
   * @param data
   */
  @Patch(':id')
  public async updateOne(
    @Param() conditions: ID,
    @Body() data: UpdateSymbolDto,
  ): Promise<SymbolEntity> {
    return this.symbolsService.updateOne(conditions, data);
  }

  /**
   * [description]
   * @param conditions
   */
  @Delete(':id')
  public async deleteOne(@Param() conditions: ID): Promise<SymbolEntity> {
    return this.symbolsService.deleteOne(conditions);
  }
}
