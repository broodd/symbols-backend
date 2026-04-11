import { ApiProperty, PickType } from '@nestjs/swagger';

import { UserRefreshTokenEntity, UserEntity } from '../../users/entities';

export class ReqUserDto extends PickType(UserEntity, ['id', 'email', 'password', 'role', 'name']) {
  /**
   * Assigned Refresh token from JWT
   */
  @ApiProperty()
  public refreshToken?: Partial<UserRefreshTokenEntity>;
}
