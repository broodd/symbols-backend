import { IsOptional, IsBoolean, MaxLength, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';

import { ApiProperty } from '@nestjs/swagger';

/**
 * [description]
 */
export class CreateSymbolDto {
  /**
   * [description]
   */
  @IsOptional()
  @MaxLength(128)
  @ApiProperty({ maxLength: 128, required: false })
  public readonly name: string;

  /**
   * [description]
   */
  @IsOptional()
  @MaxLength(128)
  @Transform(({ value }) => value.trim().toUpperCase())
  @ApiProperty({ maxLength: 128, required: false, example: 'BTCUSDT' })
  public readonly providerSymbol: string;

  /**
   * [description]
   */
  @IsOptional()
  @IsBoolean()
  @ApiProperty()
  public readonly isPublic: boolean;

  /**
   * [description]
   */
  @IsNumber()
  @IsOptional()
  @ApiProperty()
  public readonly price: number;
}
