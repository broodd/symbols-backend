import { IsString } from 'class-validator';

import { ApiProperty, PickType } from '@nestjs/swagger';

import { CreateUserDto } from 'src/modules/users/dto/crud';
import { UserEntity } from 'src/modules/users/entities';

import { JwtTokensDto } from './jwt-tokens.dto';

/**
 * [description]
 */
export class CredentialsDto extends PickType(CreateUserDto, ['email', 'password']) {
  /**
   * [description]
   */
  @IsString()
  @ApiProperty({ example: 'Password1' })
  public readonly password: string;
}

/**
 * [description]
 */
export class ResponseCredentialsDto {
  @ApiProperty()
  public readonly user: Partial<UserEntity>;

  @ApiProperty()
  public readonly tokens: JwtTokensDto;
}
