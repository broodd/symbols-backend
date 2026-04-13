import { Exclude } from 'class-transformer';
import { HydratedDocument } from 'mongoose';

import { SchemaFactory, Schema, Prop } from '@nestjs/mongoose';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';

import { CommonEntity } from 'src/common/entities';

import { UserRoleEnum } from '../enums';

/**
 * [description]
 */
@Schema({ collection: 'users', timestamps: true })
export class UserEntity extends CommonEntity {
  /**
   * [description]
   */
  @ApiProperty({ enum: UserRoleEnum, default: UserRoleEnum.CLIENT })
  @Prop({ type: String, enum: UserRoleEnum, default: UserRoleEnum.CLIENT, required: true })
  public readonly role: UserRoleEnum;

  /**
   * [description]
   */
  @ApiProperty({ maxLength: 128, uniqueItems: true })
  @Prop({ type: String, maxlength: 128, unique: true, required: true, index: true, trim: true })
  public readonly email: string;

  /**
   * [description]
   */
  @ApiHideProperty()
  @Exclude({ toPlainOnly: true })
  @Prop({ type: String, maxlength: 161, select: false, required: true })
  public password: string;

  /**
   * [description]
   */
  @ApiProperty({ maxLength: 128, nullable: true })
  @Prop({ type: String, maxlength: 128, default: null })
  public readonly name?: string;
}

export type UserDocument = HydratedDocument<UserEntity>;
export const UserSchema = SchemaFactory.createForClass(UserEntity);

UserSchema.virtual('id').get(function () {
  return this._id.toString();
});

UserSchema.set('toJSON', { virtuals: true });
UserSchema.set('toObject', { virtuals: true });
