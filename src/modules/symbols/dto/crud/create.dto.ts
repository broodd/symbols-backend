import { IsOptional, IsBoolean, MaxLength, IsNumber } from 'class-validator';

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
  @ApiProperty({ maxLength: 128, required: false })
  public readonly providerSymbol: string;

  /**
   * [description]
   */
  @IsOptional()
  @IsBoolean()
  @ApiProperty()
  public readonly public: boolean;

  /**
   * [description]
   */
  @IsNumber()
  @IsOptional()
  @ApiProperty()
  public readonly price: number;
}
