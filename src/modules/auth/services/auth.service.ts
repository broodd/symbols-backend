import { plainToInstance } from 'class-transformer';
import { FilterQuery } from 'mongoose';

import { BadRequestException, HttpException, Injectable, Type } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { FindOneBracketsOptions } from 'src/common/interfaces';
import { ErrorTypeEnum } from 'src/common/enums';
import { compare } from 'src/common/helpers';

import { ConfigService } from 'src/config';

import { UserRefreshTokensService, UsersService } from '../../users/services';
import { UserRefreshTokenEntity, UserEntity } from '../../users/entities';

import {
  JwtRefreshTokenPayloadDto,
  JwtAccessTokenPayloadDto,
  ResponseCredentialsDto,
  UpdatePasswordDto,
  CredentialsDto,
  JwtTokensDto,
  ReqUserDto,
} from '../dto';

/**
 * [description]
 */
@Injectable()
export class AuthService {
  private readonly expiresInRefreshToken;
  private readonly expiresInAccessToken;
  private readonly secretRefreshToken;
  private readonly secretAccessToken;

  constructor(
    private readonly userRefreshTokensService: UserRefreshTokensService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {
    this.expiresInRefreshToken = this.configService.get<number>('JWT_EXPIRES_REFRESH_TOKEN');
    this.expiresInAccessToken = this.configService.get<number>('JWT_EXPIRES_ACCESS_TOKEN');
    this.secretRefreshToken = this.configService.get<string>('JWT_SECRET_REFRESH_TOKEN');
    this.secretAccessToken = this.configService.get<string>('JWT_SECRET_ACCESS_TOKEN');
  }

  /**
   * Generate error in format
   * @param ErrorRef
   * @param errorType
   * @param error
   */
  public throwError(ErrorRef: Type<HttpException>, errorType: ErrorTypeEnum, error?: Error): never {
    throw new ErrorRef({ message: errorType, error });
  }

  /**
   * [description]
   * @param id
   * @param userRefreshToken
   */
  public generateAccessToken(
    { id }: Partial<UserEntity>,
    { id: refreshTokenId }: UserRefreshTokenEntity,
  ): string {
    const payload: JwtAccessTokenPayloadDto = { id, refreshTokenId };
    return this.jwtService.sign(payload, {
      expiresIn: this.expiresInAccessToken,
      secret: this.secretAccessToken,
    });
  }

  /**
   * [description]
   * @param id
   * @param userRefreshToken
   */
  public generateRefreshToken(
    { id }: Partial<UserEntity>,
    { id: refreshTokenId, ppid }: UserRefreshTokenEntity,
  ): string {
    const payload: JwtRefreshTokenPayloadDto = { id, refreshTokenId, ppid };
    return this.jwtService.sign(payload, {
      expiresIn: this.expiresInRefreshToken,
      secret: this.secretRefreshToken,
    });
  }

  /**
   * [description]
   * @param user
   * @param userRefreshToken
   */
  public generateTokens(
    user: Partial<UserEntity>,
    userRefreshToken: UserRefreshTokenEntity,
  ): JwtTokensDto {
    const token = this.generateAccessToken(user, userRefreshToken);
    const refreshToken = this.generateRefreshToken(user, userRefreshToken);
    return { token, refreshToken };
  }

  /**
   * [description]
   * @param email
   * @param password
   */
  public async login(data: CredentialsDto): Promise<ResponseCredentialsDto> {
    const user = await this.validateUser({ email: data.email }, { projection: '+password' });

    if (!(await this.validatePassword(data.password, user.password)))
      throw new BadRequestException(ErrorTypeEnum.AUTH_INCORRECT_CREDENTIALS);

    const refreshToken = await this.userRefreshTokensService.generateAndCreateOne({
      userId: user.id,
    });

    await this.userRefreshTokensService.deleteOldRefreshTokens({ userId: user.id });
    const tokens = await this.generateTokens(user, refreshToken);

    return plainToInstance(ResponseCredentialsDto, { tokens, user });
  }

  /**
   * [description]
   * @param conditions
   * @param options
   */
  public async validateUser(
    conditions: FilterQuery<UserEntity>,
    options?: FindOneBracketsOptions<UserEntity>,
  ): Promise<ReqUserDto> {
    const initialOptions = { projection: 'role email name' };
    return this.usersService
      .selectOne(conditions, Object.assign(initialOptions, options))
      .catch((error) =>
        this.throwError(BadRequestException, ErrorTypeEnum.AUTH_INCORRECT_CREDENTIALS, error),
      );
  }

  /**
   * [description]
   * @param data
   * @param encrypted
   */
  public async validatePassword(data: string, encrypted: string): Promise<boolean> {
    return compare(data, encrypted).catch(() => {
      throw new BadRequestException(ErrorTypeEnum.AUTH_PASSWORDS_DO_NOT_MATCH);
    });
  }

  /**
   * [description]
   * @param data
   * @param user
   */
  public async updatePassword(
    data: UpdatePasswordDto,
    user: Partial<UserEntity>,
  ): Promise<UserEntity> {
    if (!(await this.validatePassword(data.oldPassword, user.password)))
      throw new BadRequestException(ErrorTypeEnum.AUTH_PASSWORDS_DO_NOT_MATCH);
    return this.usersService.updateOne({ id: user.id }, { password: data.password });
  }
}
