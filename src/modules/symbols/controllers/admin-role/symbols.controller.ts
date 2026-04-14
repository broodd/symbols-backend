import {
  Controller,
  forwardRef,
  UseGuards,
  Delete,
  Inject,
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
import { BinanceProviderService } from 'src/modules/binance-provider';
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
  constructor(
    private readonly symbolsService: SymbolsService,
    @Inject(forwardRef(() => BinanceProviderService))
    private readonly binanceProviderService: BinanceProviderService,
  ) {}

  /**
   * [description]
   * @param data
   */
  @Post()
  public async createOne(@Body() data: CreateSymbolDto): Promise<SymbolEntity> {
    const symbol = await this.symbolsService.createOne(data);
    await this.binanceProviderService.registerSymbol(symbol);
    return symbol;
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
    const current = await this.symbolsService.selectOne(conditions);
    const symbol = await this.symbolsService.updateOne(conditions, data);
    await this.binanceProviderService.syncSymbol(current, symbol);
    return symbol;
  }

  /**
   * [description]
   * @param conditions
   */
  @Delete(':id')
  public async deleteOne(@Param() conditions: ID): Promise<SymbolEntity> {
    const symbol = await this.symbolsService.deleteOne(conditions);
    await this.binanceProviderService.unregisterSymbol(symbol);
    return symbol;
  }
}
