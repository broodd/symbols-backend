import { IsOptional, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';

import { ApiProperty } from '@nestjs/swagger';

import { FindManyOptionsDto } from 'src/common/dto';

import { UserEntity } from '../../entities';
import { UserRoleEnum } from '../../enums';

/**
 * [description]
 */
export class SelectUsersDto extends FindManyOptionsDto<UserEntity> {
  /**
   * [description]
   */
  @IsOptional()
  @ApiProperty({ enum: UserRoleEnum })
  @IsEnum(UserRoleEnum, { each: true })
  @Transform(({ value }) => [].concat(value))
  public roles?: UserRoleEnum[];

  /**
   * [description]
   */
  public get filter(): Record<string, unknown> {
    const { roles } = this;

    return Object.assign({}, roles?.length && { role: { $in: roles } });
  }
}
