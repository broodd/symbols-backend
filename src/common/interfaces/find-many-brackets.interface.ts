import { PopulateOptions, QueryOptions, FilterQuery } from 'mongoose';

import { CustomExtendedOptions } from '../dto/custom-extended-options';

/**
 * [description]
 */
export interface FindManyBracketsOptions<Entity = any> extends CustomExtendedOptions {
  /**
   * Mongo filter
   */
  filter?: FilterQuery<Entity>;

  /**
   * Mongo projection
   */
  projection?: Record<string, unknown> | string[] | string | null;

  /**
   * Mongo query options
   */
  options?: QueryOptions;

  /**
   * Mongo sort
   */
  sort?: Record<string, 1 | -1> | string;

  /**
   * [description]
   */
  skip?: number;

  /**
   * [description]
   */
  limit?: number;

  /**
   * [description]
   */
  populate?: string | PopulateOptions | Array<string | PopulateOptions>;

  /**
   * [description]
   */
  isManyOptions?: boolean;
}

/**
 * [description]
 */
export interface FindOneBracketsOptions<Entity = any> extends Omit<
  FindManyBracketsOptions<Entity>,
  'skip' | 'limit'
> {}
