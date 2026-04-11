import '@fastify/cookie';
import { FastifyRequest } from 'fastify';
import { Strategy } from 'passport-jwt';

import { BadRequestException, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

import { ErrorTypeEnum } from 'src/common/enums';
import { compare } from 'src/common/helpers';

import { ConfigService } from 'src/config';

import { UserRefreshTokensService } from 'src/modules/users/services';

import { JwtRefreshTokenPayloadDto, JwtRefreshTokenDto, ReqUserDto } from '../dto';
import { AuthService } from '../services';

/**
 * [description]
 */
@Injectable()
export class JwtRefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh-token') {
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
      jwtFromRequest: JwtRefreshTokenStrategy.extractJwtFromCookie,
      secretOrKey: configService.get('JWT_SECRET_REFRESH_TOKEN'),
    });
  }

  /**
   * [description]
   * @param req
   */
  private static extractJwtFromCookie(req: FastifyRequest): string | null {
    const bodyToken = (req.body as JwtRefreshTokenDto)?.refreshToken;
    if (bodyToken) return bodyToken;

    if (!req.cookies) return null;
    return req.cookies['refreshToken'] || null;
  }

  /**
   * [description]
   * @param id
   */
  public async validate({
    id,
    ppid,
    refreshTokenId,
  }: JwtRefreshTokenPayloadDto): Promise<ReqUserDto> {
    const user = await this.authService.validateUser({ id });
    const refreshToken = await this.userRefreshTokensService.selectOne({
      id: refreshTokenId,
      userId: id,
    });

    if (!(await compare(ppid, refreshToken.ppid)))
      throw new BadRequestException(ErrorTypeEnum.AUTH_INCORRECT_CREDENTIALS);
    return user;
  }
}
