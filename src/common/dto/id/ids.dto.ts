import { Transform } from 'class-transformer';
import { IsMongoId } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

/**
 * [description]
 */
export class IDs {
  /**
   * Entity ID
   */
  @IsMongoId({ each: true })
  @Transform(({ value }) => [].concat(value))
  @ApiProperty({ example: ['xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'] })
  public readonly ids: string[];
}

/**
 * [description]
 */
export class TwoID {
  /**
   * Main ID
   */
  @IsMongoId()
  @ApiProperty()
  public readonly mainId: string;

  /**
   * Entity ID
   */
  @IsMongoId()
  @ApiProperty()
  public readonly entityId: string;
}
