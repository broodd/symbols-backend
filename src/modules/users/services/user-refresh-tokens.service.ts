import { FilterQuery, Model } from 'mongoose';

import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';

import { generateRandomToken, hash } from 'src/common/helpers';
import { CommonService } from 'src/common/services';

import { PaginationUsersRefreshTokensDto } from '../dto/crud';
import { UserRefreshTokenEntity } from '../entities';

/**
 * [description]
 */
@Injectable()
export class UserRefreshTokensService extends CommonService<
  UserRefreshTokenEntity,
  PaginationUsersRefreshTokensDto
> {
  /**
   * [description]
   */
  private readonly maxCountOfRefreshTokens = 10;

  /**
   * [description]
   * @param repository
   */
  constructor(
    @InjectModel(UserRefreshTokenEntity.name)
    public readonly model: Model<UserRefreshTokenEntity>,
  ) {
    super(UserRefreshTokenEntity, model, PaginationUsersRefreshTokensDto);
  }

  /**
   * [description]
   * @param entityLike
   */
  public async generateAndCreateOne(
    entityLike: Partial<UserRefreshTokenEntity>,
  ): Promise<UserRefreshTokenEntity> {
    const refreshIdentifier = generateRandomToken(16);
    const refreshHash = await hash(refreshIdentifier);

    const entity = await this.createOne({ ...entityLike, ppid: refreshHash });
    entity.ppid = refreshIdentifier;
    return entity;
  }

  /**
   * [description]
   * @param conditions
   */
  public async deleteOldRefreshTokens(
    conditions: FilterQuery<UserRefreshTokenEntity>,
  ): Promise<void> {
    const tokens = await this.selectMany({
      projection: { _id: 1, createdAt: 1 },
      filter: conditions,
      skip: this.maxCountOfRefreshTokens,
      sort: { createdAt: -1 },
    });
    if (!tokens.length) return;

    await this.model
      .deleteMany({ _id: { $in: tokens.map((token: any) => token._id ?? token.id) } })
      .exec();
  }
}
