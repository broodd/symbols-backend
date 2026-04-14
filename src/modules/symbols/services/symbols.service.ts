import { Model } from 'mongoose';

import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';

import { CommonService } from 'src/common/services';

import { PaginationSymbolsDto } from '../dto/crud';
import { SymbolEntity } from '../entities';

/**
 * [description]
 */
@Injectable()
export class SymbolsService extends CommonService<SymbolEntity, PaginationSymbolsDto> {
  /**
   * [description]
   * @param repository
   */
  constructor(
    @InjectModel(SymbolEntity.name)
    public readonly model: Model<SymbolEntity>,
  ) {
    super(SymbolEntity, model, PaginationSymbolsDto);
  }
}
