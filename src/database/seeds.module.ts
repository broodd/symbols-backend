import { CommandModule } from 'nestjs-command';

import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';

import {
  UserRefreshTokenEntity,
  UserRefreshTokenSchema,
  UserEntity,
  UserSchema,
} from 'src/modules/users/entities';
import { SymbolEntity, SymbolSchema } from 'src/modules/symbols/entities';
import { SymbolsService } from 'src/modules/symbols/services';
import { UsersService } from 'src/modules/users/services';

import { ClientUserSeed } from './seeds/client-user.seed';
import { AdminUserSeed } from './seeds/admin-user.seed';
import { SymbolsSeed } from './seeds/symbols.seed';

@Module({
  imports: [
    CommandModule,
    MongooseModule.forFeature([
      { name: UserEntity.name, schema: UserSchema },
      { name: UserRefreshTokenEntity.name, schema: UserRefreshTokenSchema },
    ]),
    MongooseModule.forFeature([{ name: SymbolEntity.name, schema: SymbolSchema }]),
  ],
  providers: [AdminUserSeed, ClientUserSeed, SymbolsSeed, UsersService, SymbolsService],
})
export class SeedsModule {}
