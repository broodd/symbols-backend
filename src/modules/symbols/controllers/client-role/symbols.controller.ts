import { Controller, UseGuards, Param, Query, Get } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';

import { UseRole } from 'src/common/decorators';
import { ID } from 'src/common/dto';

import { PaginationSymbolsDto, SelectSymbolsDto, SelectSymbolDto } from '../../dto/crud';
import { JwtAuthGuard } from 'src/modules/auth/guards';
import { UserRoleEnum } from 'src/modules/users/enums';
import { SymbolsService } from '../../services';
import { SymbolEntity } from '../../entities';

/**
 * [description]
 */
@UseGuards(JwtAuthGuard)
@UseRole(UserRoleEnum.CLIENT)
@ApiCookieAuth('accessToken')
@ApiTags('symbols/client-role')
@Controller('client-role/symbols')
export class ClientRole_SymbolsController {
  /**
   * [description]
   * @param symbolsService
   */
  constructor(private readonly symbolsService: SymbolsService) {}

  /**
   * [description]
   * @param options
   */
  @Get()
  public async selectManyAndCount(
    @Query() options: SelectSymbolsDto,
  ): Promise<PaginationSymbolsDto> {
    options.isPublic = true;
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
    return this.symbolsService.selectOne({ ...conditions, isPublic: true }, options);
  }
}
