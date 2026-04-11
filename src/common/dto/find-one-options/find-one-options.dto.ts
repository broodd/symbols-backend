import { IsNotEmpty, IsOptional, IsString, IsArray } from 'class-validator';
import { Transform, Exclude, Expose } from 'class-transformer';

import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';

import { FindOneBracketsOptions } from 'src/common/interfaces';

import { CustomExtendedOptionsDto } from '../custom-extended-options';

/**
 * [description]
 */
export class FindOneOptionsDto<Entity>
  extends CustomExtendedOptionsDto
  implements FindOneBracketsOptions
{
  /**
   * Specifies what columns should be retrieved
   */
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @Exclude({ toPlainOnly: true })
  @Transform(({ value }) => [].concat(value))
  @ApiProperty({
    type: [String],
    example: [],
    description: 'Specifies what columns should be retrieved',
  })
  public selection?: string[];

  /**
   * Expose field `projection`, specifies what columns should be retrieved
   */
  @Expose({ toPlainOnly: true })
  public get projection(): Record<string, unknown> | string | null {
    if (!this.selection?.length) return null;
    return this.selection.join(' ');
  }

  /**
   * Indicates what relations of entity should be loaded (simplified left join form)
   */
  @ApiHideProperty()
  public eager?: boolean;

  /**
   * Specifies what fields should be populated
   */
  @ApiHideProperty()
  public populate: string[];
}
