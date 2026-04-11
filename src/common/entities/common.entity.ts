import { Schema, Prop } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';

/**
 * [description]
 */
@Schema({ timestamps: true })
export class CommonEntity {
  /**
   * [description]
   */
  @ApiProperty({ readOnly: true })
  public readonly id: string;

  /**
   * [description]
   */
  @ApiProperty({ readOnly: true })
  @Prop({ type: Date })
  public readonly createdAt: Date;

  /**
   * [description]
   */
  @ApiProperty({ readOnly: true })
  @Prop({ type: Date })
  public readonly updatedAt: Date;
}
