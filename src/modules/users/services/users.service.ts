import { Model } from 'mongoose';

import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';

import { FindManyBracketsOptions } from 'src/common/interfaces';
import { CommonService } from 'src/common/services';

import { PaginationUsersDto } from '../dto/crud';
import { UserEntity } from '../entities';

/**
 * [description]
 */
@Injectable()
export class UsersService extends CommonService<UserEntity, PaginationUsersDto> {
  /**
   * [description]
   * @param repository
   */
  constructor(
    @InjectModel(UserEntity.name)
    public readonly model: Model<UserEntity>,
  ) {
    super(UserEntity, model, PaginationUsersDto);
  }

  /**
   * [description]
   * @param options
   */
  public find(options: FindManyBracketsOptions<UserEntity> = {}) {
    return super.find(options);
  }
}
