import { ApiProperty } from '@nestjs/swagger';

import { PaginationDto } from 'src/common/dto';

import { SymbolEntity } from '../../entities';

/**
 * [description]
 */
export class PaginationSymbolsDto extends PaginationDto<SymbolEntity> {
  /**
   * Result of the selection by the specified parameters.
   */
  @ApiProperty({ type: () => [SymbolEntity] })
  public readonly result: SymbolEntity[];

  /**
   * Total number of records.
   */
  @ApiProperty()
  public readonly count: number;
}
