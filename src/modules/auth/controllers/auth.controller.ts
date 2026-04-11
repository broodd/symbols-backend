import { FastifyReply } from 'fastify';

import {
  ClassSerializerInterceptor,
  UseInterceptors,
  Controller,
  UseGuards,
  Patch,
  Query,
  Body,
  Post,
  Get,
  Res,
} from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';

import { LimitAttempts, ReqUser } from 'src/common/decorators';

import { ConfigService } from 'src/config';

import { UserRefreshTokensService, UsersService } from '../../users/services';
import { UserEntity } from '../../users/entities';

import {
  ResponseCredentialsDto,
  UpdatePasswordDto,
  SelectProfileDto,
  UpdateProfileDto,
  CredentialsDto,
  JwtTokensDto,
} from '../dto';
import { JwtRefreshGuard, JwtAuthGuard } from '../guards';
import { ReqUserDto } from '../dto/req-auth-user.dto';
import { AuthService } from '../services';

/**
 * [description]
 */
@ApiTags('auth')
@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  /**
   * Cookie secure config
   */
  private readonly cookieIsSecure = this.configService.get<boolean>('COOKIE_SECURE');
  private readonly cookieSameSite = this.cookieIsSecure ? 'strict' : 'lax';

  /**
   * [description]
   * @param usersService
   * @param authService
   */
  constructor(
    private readonly userRefreshTokensService: UserRefreshTokensService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  /**
   * [description]
   * @param reply
   * @param tokens
   */
  private setCookieTokens(reply: FastifyReply, tokens: JwtTokensDto): void {
    reply.setCookie('accessToken', tokens.token, {
      secure: this.cookieIsSecure,
      sameSite: this.cookieSameSite,
      httpOnly: true,
      path: '/',
    });
    reply.setCookie('refreshToken', tokens.refreshToken, {
      secure: this.cookieIsSecure,
      sameSite: this.cookieSameSite,
      httpOnly: true,
      path: '/',
    });
  }

  /**
   * [description]
   * @param data
   */
  @Post('login')
  @LimitAttempts('login', 5, 60, (req) => req.body.email)
  public async createToken(
    @Body() data: CredentialsDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<ResponseCredentialsDto> {
    const response = await this.authService.login(data);

    this.setCookieTokens(reply, response.tokens);
    return response;
  }

  /**
   * [description]
   * @param data
   */
  @Post('logout')
  @UseGuards(JwtRefreshGuard)
  @ApiCookieAuth('refreshToken')
  public async logOut(
    @ReqUser() user: ReqUserDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<void> {
    reply.clearCookie('accessToken');
    reply.clearCookie('refreshToken');

    await this.userRefreshTokensService.deleteOne({ id: user.refreshToken!.id, ownerId: user.id });
  }

  /**
   * [description]
   * @param user
   */
  @Post('refresh-tokens')
  @UseGuards(JwtRefreshGuard)
  @ApiCookieAuth('refreshToken')
  public async refreshTokens(
    @ReqUser() user: ReqUserDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<JwtTokensDto> {
    const refreshToken = await this.userRefreshTokensService.generateAndCreateOne({
      id: user.refreshToken!.id,
      userId: user.id,
    });
    const tokens = await this.authService.generateTokens(user, refreshToken);

    this.setCookieTokens(reply, tokens);
    return tokens;
  }

  /**
   * [description]
   * @param user
   * @param options
   */
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth('accessToken')
  public async selectProfile(
    @ReqUser() user: UserEntity,
    @Query() options: SelectProfileDto,
  ): Promise<UserEntity> {
    return this.usersService.selectOne({ id: user.id }, options);
  }

  /**
   * [description]
   * @param user
   * @param data
   */
  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth('accessToken')
  public async updateProfile(
    @Body() data: UpdateProfileDto,
    @ReqUser() user: ReqUserDto,
  ): Promise<UserEntity> {
    return this.usersService.updateOne({ id: user.id }, data);
  }

  /**
   * [description]
   * @param data
   */
  @UseGuards(JwtAuthGuard)
  @Patch('profile/password')
  @ApiCookieAuth('accessToken')
  public async updatePassword(
    @Body() data: UpdatePasswordDto,
    @ReqUser() user: ReqUserDto,
  ): Promise<UserEntity> {
    return this.authService.updatePassword(data, user);
  }
}
