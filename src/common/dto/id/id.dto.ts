import { IsMongoId } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

/**
 * [description]
 */
export class ID {
  /**
   * Entity ID
   */
  @IsMongoId()
  @ApiProperty()
  public readonly id: string;
}
