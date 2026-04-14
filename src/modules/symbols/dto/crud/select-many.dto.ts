import { IsOptional, IsBoolean, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

import { ApiPropertyOptional } from '@nestjs/swagger';

import { FindManyOptionsDto } from 'src/common/dto';

import { SymbolEntity } from '../../entities';

/**
 * [description]
 */
export class SelectSymbolsDto extends FindManyOptionsDto<SymbolEntity> {
  /**
   * [description]
   */
  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional()
  public isPublic?: boolean;

  /**
   * [description]
   */
  @IsOptional()
  @MinLength(3)
  @MaxLength(256)
  @ApiPropertyOptional()
  @Transform(({ value }) => value && value.replace(/\s/g, ''))
  public readonly search?: string;

  /**
   * [description]
   */
  public get filter(): Record<string, unknown> {
    const { isPublic, search } = this;

    return Object.assign(
      {},
      isPublic !== undefined && { isPublic },
      search && {
        name: {
          $regex: search,
          $options: 'i',
        },
      },
    );
  }
}
