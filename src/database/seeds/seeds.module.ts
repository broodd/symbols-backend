import { CommandModule } from 'nestjs-command';

import { Module } from '@nestjs/common';

import { UsersModule } from 'src/modules/users';

import { AdminUserSeed } from './admin-user.seed';

@Module({
  imports: [CommandModule, UsersModule],
  providers: [AdminUserSeed],
})
export class SeedsModule {}
