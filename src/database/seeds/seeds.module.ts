import { CommandModule } from 'nestjs-command';

import { Module } from '@nestjs/common';

import { UsersModule } from 'src/modules/users';

import { ClientUserSeed } from './client-user.seed';
import { AdminUserSeed } from './admin-user.seed';

@Module({
  imports: [CommandModule, UsersModule],
  providers: [AdminUserSeed, ClientUserSeed],
})
export class SeedsModule {}
