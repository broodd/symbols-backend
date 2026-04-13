import { HydratedDocument } from 'mongoose';

import { SchemaFactory, Schema, Prop } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';

import { CommonEntity } from 'src/common/entities';

/**
 * [description]
 */
@Schema({ collection: 'symbols', timestamps: true })
export class SymbolEntity extends CommonEntity {
  /**
   * Real Binance symbol, example: BTCUSDT
   */
  @ApiProperty({ maxLength: 128, nullable: false })
  @Prop({ type: String, maxlength: 128 })
  public readonly providerSymbol: string;

  /**
   * [description]
   */
  @ApiProperty({ maxLength: 128, nullable: true })
  @Prop({ type: String, maxlength: 128, default: null })
  public readonly name?: string;

  /**
   * [description]
   */
  @ApiProperty()
  @Prop({ type: Boolean, default: false })
  public readonly isPublic: boolean;

  /**
   * [description]
   */
  @ApiProperty()
  @Prop({ type: Number })
  public readonly price: number;
}

export type SymbolDocument = HydratedDocument<SymbolEntity>;
export const SymbolSchema = SchemaFactory.createForClass(SymbolEntity);

SymbolSchema.virtual('id').get(function () {
  return this._id.toString();
});

SymbolSchema.set('toJSON', { virtuals: true });
SymbolSchema.set('toObject', { virtuals: true });
