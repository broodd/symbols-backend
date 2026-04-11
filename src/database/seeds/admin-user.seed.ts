import { Command } from 'nestjs-command';

import { Injectable } from '@nestjs/common';

import { hash } from 'src/common/helpers';

import { ConfigService } from 'src/config';

import { UsersService } from 'src/modules/users/services';
import { UserRoleEnum } from 'src/modules/users/enums';

@Injectable()
export class AdminUserSeed {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  @Command({
    command: 'seed:admin',
    describe: 'Create/update default admin user',
  })
  public async run(): Promise<void> {
    const email = this.configService.get('SEED_ADMIN_EMAIL', 'admin@gmail.com').toLowerCase();
    const password = this.configService.get('SEED_ADMIN_PASSWORD', 'Password1');
    const name = this.configService.get('SEED_ADMIN_NAME', 'Admin');

    const existing = await this.usersService.selectOne({ email }).catch(() => null);
    const passwordHash = await hash(password);

    if (!existing) {
      await this.usersService.createOne({
        email,
        password: passwordHash,
        role: UserRoleEnum.ADMIN,
        name,
      });

      return;
    }

    await this.usersService.updateOne(
      { id: existing.id },
      {
        role: UserRoleEnum.ADMIN,
        password: passwordHash,
        name,
      },
    );
  }
}
