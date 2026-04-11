import { HydratedDocument, SchemaTypes } from 'mongoose';
import { Exclude } from 'class-transformer';

import { SchemaFactory, Schema, Prop } from '@nestjs/mongoose';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';

import { CommonEntity } from 'src/common/entities';

/**
 * [description]
 */
@Schema({ collection: 'user_refresh_tokens', timestamps: true })
export class UserRefreshTokenEntity extends CommonEntity {
  /**
   * [description]
   */
  @Exclude()
  @ApiHideProperty()
  @Prop({ type: String, maxlength: 161, required: true })
  public ppid: string;

  /**
   * [description]
   */
  @ApiProperty()
  @Prop({ type: SchemaTypes.ObjectId, required: true, index: true })
  public readonly userId: string;
}

export type UserRefreshTokenDocument = HydratedDocument<UserRefreshTokenEntity>;
export const UserRefreshTokenSchema = SchemaFactory.createForClass(UserRefreshTokenEntity);

UserRefreshTokenSchema.virtual('id').get(function () {
  return this._id.toString();
});

UserRefreshTokenSchema.set('toJSON', { virtuals: true });
UserRefreshTokenSchema.set('toObject', { virtuals: true });
