import { IsOptional, IsDefined, MaxLength, IsEmail, Matches, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';

import { ApiProperty } from '@nestjs/swagger';

import { AUTH_PASSWORD_REGEX } from 'src/modules/auth/auth.constants';
import { UserRoleEnum } from '../../enums';

/**
 * [description]
 */
export class CreateUserDto {
  /**
   * [description]
   */
  @IsOptional()
  @IsEnum(UserRoleEnum)
  @ApiProperty({ enum: UserRoleEnum })
  public readonly role?: UserRoleEnum;

  /**
   * [description]
   */
  @IsEmail()
  @MaxLength(64)
  @Transform(({ value }) => value.toLowerCase(value))
  @ApiProperty({ example: 'admin@gmail.com', maxLength: 64 })
  public readonly email: string;

  /**
   * [description]
   */
  @IsDefined()
  @Matches(AUTH_PASSWORD_REGEX)
  @ApiProperty({ minLength: 8, maxLength: 64, example: 'Password1' })
  public readonly password: string;

  /**
   * [description]
   */
  @IsOptional()
  @MaxLength(128)
  @ApiProperty({ maxLength: 128, required: false })
  public readonly name: string;
}
