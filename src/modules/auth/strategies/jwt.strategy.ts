import '@fastify/cookie';
import { FastifyRequest } from 'fastify';
import { Strategy } from 'passport-jwt';

import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

import { ConfigService } from 'src/config';

import { UserRefreshTokensService } from 'src/modules/users/services';

import { JwtAccessTokenPayloadDto, ReqUserDto } from '../dto';
import { AuthService } from '../services/auth.service';

/**
 * [description]
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  /**
   * [description]
   * @param configService
   * @param authService
   */
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly userRefreshTokensService: UserRefreshTokensService,
  ) {
    super({
      jwtFromRequest: JwtStrategy.extractJwtFromCookieOrHeader,
      secretOrKey: configService.get('JWT_SECRET_ACCESS_TOKEN'),
    });
  }

  /**
   * [description]
   * @param req
   */
  private static extractJwtFromCookieOrHeader(req: FastifyRequest): string | null {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.split(' ')[1];
    }

    if (!req.cookies) return null;
    return req.cookies['accessToken'] || null;
  }

  /**
   * [description]
   * @param id
   */
  public async validate({
    id,
    refreshTokenId,
    isDev,
  }: JwtAccessTokenPayloadDto): Promise<ReqUserDto> {
    if (isDev) return this.authService.validateUser({ id });

    const user = await this.authService.validateUser({ id });
    await this.userRefreshTokensService.selectOne({ id: refreshTokenId, userId: id });
    return user;
  }
}
