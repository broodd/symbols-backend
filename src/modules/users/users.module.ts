import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';

import { UserRefreshTokenEntity, UserRefreshTokenSchema, UserEntity, UserSchema } from './entities';
import { AdminRole_UsersController } from './controllers/admin-role';
import { UserRefreshTokensService, UsersService } from './services';

/**
 * [description]
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserEntity.name, schema: UserSchema },
      { name: UserRefreshTokenEntity.name, schema: UserRefreshTokenSchema },
    ]),
  ],
  controllers: [AdminRole_UsersController],
  providers: [UsersService, UserRefreshTokensService],
  exports: [UsersService, UserRefreshTokensService],
})
export class UsersModule {}
