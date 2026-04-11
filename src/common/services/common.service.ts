import { FilterQuery, UpdateQuery, Model } from 'mongoose';
import { plainToInstance } from 'class-transformer';

import { ConflictException, NotFoundException, HttpException, Type } from '@nestjs/common';

import { FindManyBracketsOptions, FindOneBracketsOptions } from 'src/common/interfaces';
import { ErrorTypeEnum } from 'src/common/enums';

/**
 * [description]
 */
export class CommonService<EntityClass, PaginationClass> {
  /**
   * [description]
   * @param entityClass
   * @param model
   * @param paginationClass
   * @param errorPrefix
   */
  constructor(
    public readonly entityClass: Type<EntityClass>,
    public readonly model: Model<EntityClass>,
    public readonly paginationClass: Type<PaginationClass>,
    public readonly errorPrefix: string = '',
  ) {}

  /**
   * Generate error in format
   * @param ErrorRef
   * @param errorType
   * @param error
   */
  public throwError(ErrorRef: Type<HttpException>, errorType: ErrorTypeEnum, error?: Error): never {
    throw new ErrorRef({ message: this.errorPrefix + errorType, error });
  }

  private toEntityInstance(value: any): any {
    if (value === null || value === undefined) return value;
    if (Array.isArray(value)) return value.map((v) => this.toEntityInstance(v));

    const plain =
      value && typeof value === 'object' && typeof value.toObject === 'function'
        ? value.toObject()
        : value;

    if (plain && typeof plain === 'object') {
      delete plain._id;
      delete plain.__v;
    }

    return plainToInstance(this.entityClass, plain);
  }

  private normalizeFilter(filter: FilterQuery<EntityClass> = {}): FilterQuery<EntityClass> {
    const normalized = { ...(filter as Record<string, unknown>) } as Record<string, unknown>;
    if (normalized.id && !normalized._id) {
      normalized._id = normalized.id;
      delete normalized.id;
    }
    return normalized as FilterQuery<EntityClass>;
  }

  private normalizeProjection(
    projection?: Record<string, unknown> | string[] | string | null,
  ): Record<string, unknown> | string | undefined {
    if (!projection) return undefined;
    if (Array.isArray(projection)) return projection.join(' ');
    return projection as Record<string, unknown> | string;
  }

  private applyQueryOptions(
    query: ReturnType<Model<EntityClass>['find']>,
    options: FindManyBracketsOptions<EntityClass>,
  ): void {
    if (options.sort) query.sort(options.sort);
    if (options.skip !== undefined) query.skip(options.skip);
    if (options.limit !== undefined) query.limit(options.limit);
    if (options.populate) query.populate(options.populate as any);
  }

  /**
   * [description]
   * @param entitiesLike
   */
  public async insert(
    entitiesLike: Partial<EntityClass> | Array<Partial<EntityClass>>,
  ): Promise<EntityClass | EntityClass[]> {
    try {
      if (Array.isArray(entitiesLike)) {
        const created = await this.model.insertMany(entitiesLike, { ordered: true });
        return this.toEntityInstance(created) as EntityClass[];
      }
      const created = await this.model.create(entitiesLike);
      return this.toEntityInstance(created) as EntityClass;
    } catch (error) {
      this.throwError(ConflictException, ErrorTypeEnum.INPUT_DATA_ERROR, error as Error);
    }
  }

  /**
   * [description]
   * @param entitiesLike
   */
  public async createMany(entitiesLike: Array<Partial<EntityClass>>): Promise<EntityClass[]> {
    try {
      const created = await this.model.insertMany(entitiesLike, { ordered: true });
      return this.toEntityInstance(created) as EntityClass[];
    } catch (error) {
      this.throwError(ConflictException, ErrorTypeEnum.INPUT_DATA_ERROR, error as Error);
    }
  }

  /**
   * [description]
   * @param entityLike
   */
  public async createOne(entityLike: Partial<EntityClass>): Promise<EntityClass> {
    try {
      const created = await this.model.create(entityLike);
      return this.toEntityInstance(created) as EntityClass;
    } catch (error) {
      this.throwError(ConflictException, ErrorTypeEnum.INPUT_DATA_ERROR, error as Error);
    }
  }

  /**
   * [description]
   * @param entityLike
   */
  public async createOneAndSelect(
    entityLike: Partial<EntityClass>,
    options: FindOneBracketsOptions<EntityClass> = {},
  ): Promise<EntityClass> {
    const entity = await this.createOne(entityLike);
    const id = (entity as any)?._id ?? (entity as any)?.id;
    return this.selectOne({ _id: id } as FilterQuery<EntityClass>, options);
  }

  /**
   * [description]
   * @param options
   */
  public find(options: FindManyBracketsOptions<EntityClass> = {}) {
    const filter = this.normalizeFilter(options.filter || {});
    const projection = this.normalizeProjection(options.projection);
    const query = this.model.find(filter, projection, options.options);
    this.applyQueryOptions(query, options);
    return query;
  }

  /**
   * [description]
   * @param options
   */
  public async selectManyAndCount(
    options: FindManyBracketsOptions<EntityClass> = {},
  ): Promise<PaginationClass> {
    try {
      const filter = this.normalizeFilter(options.filter || {});
      const [items, total] = await Promise.all([
        this.find(options).exec(),
        this.model.countDocuments(filter).exec(),
      ]);
      return new this.paginationClass([this.toEntityInstance(items), total]);
    } catch (error) {
      this.throwError(NotFoundException, ErrorTypeEnum.NOT_FOUND_ERROR, error as Error);
    }
  }

  /**
   * [description]
   * @param options
   */
  public async selectMany(
    options: FindManyBracketsOptions<EntityClass> = {},
  ): Promise<EntityClass[]> {
    try {
      const items = await this.find(options).exec();
      return this.toEntityInstance(items) as EntityClass[];
    } catch (error) {
      this.throwError(NotFoundException, ErrorTypeEnum.NOT_FOUND_ERROR, error as Error);
    }
  }

  /**
   * [description]
   * @param conditions
   * @param options
   */
  public async selectOne(
    conditions: FilterQuery<EntityClass>,
    options: FindOneBracketsOptions<EntityClass> = {},
  ): Promise<EntityClass> {
    try {
      const filter = this.normalizeFilter(conditions);
      const projection = this.normalizeProjection(options.projection);
      const query = this.model.findOne(filter, projection, options.options);
      if (options.populate) query.populate(options.populate as any);
      const doc = await query.exec();
      if (!doc) {
        this.throwError(NotFoundException, ErrorTypeEnum.NOT_FOUND_ERROR);
      }
      return this.toEntityInstance(doc) as EntityClass;
    } catch (error) {
      this.throwError(NotFoundException, ErrorTypeEnum.NOT_FOUND_ERROR, error as Error);
    }
  }

  /**
   * [description]
   * @param conditions
   * @param entityLike
   */
  public async updateOne(
    conditions: FilterQuery<EntityClass>,
    entityLike: UpdateQuery<EntityClass>,
  ): Promise<EntityClass> {
    try {
      const filter = this.normalizeFilter(conditions);
      const updated = await this.model
        .findOneAndUpdate(filter, entityLike, { new: true, runValidators: true })
        .exec();
      if (!updated) {
        this.throwError(NotFoundException, ErrorTypeEnum.NOT_FOUND_ERROR);
      }
      return this.toEntityInstance(updated) as EntityClass;
    } catch (error) {
      this.throwError(ConflictException, ErrorTypeEnum.INPUT_DATA_ERROR, error as Error);
    }
  }

  /**
   * [description]
   * @param conditions
   * @param entityLike
   */
  public async updateOneAndSelect(
    conditions: FilterQuery<EntityClass>,
    entityLike: UpdateQuery<EntityClass>,
  ): Promise<EntityClass> {
    const updated = await this.updateOne(conditions, entityLike);
    const id = (updated as any)?._id ?? (updated as any)?.id;
    return this.selectOne({ _id: id } as FilterQuery<EntityClass>);
  }

  /**
   * [description]
   * @param conditions
   * @param entityLike
   */
  public async update(
    conditions: FilterQuery<EntityClass>,
    entityLike: UpdateQuery<EntityClass>,
  ): Promise<number> {
    try {
      const filter = this.normalizeFilter(conditions);
      const result = await this.model
        .updateMany(filter, entityLike, { runValidators: true })
        .exec();
      return result.modifiedCount ?? result.matchedCount ?? 0;
    } catch (error) {
      this.throwError(ConflictException, ErrorTypeEnum.INPUT_DATA_ERROR, error as Error);
    }
  }

  /**
   * [description]
   * @param conditions
   */
  public async deleteOne(conditions: FilterQuery<EntityClass>): Promise<EntityClass> {
    try {
      const filter = this.normalizeFilter(conditions);
      const removed = await this.model.findOneAndDelete(filter).exec();
      if (!removed) {
        this.throwError(NotFoundException, ErrorTypeEnum.NOT_FOUND_ERROR);
      }
      return this.toEntityInstance(removed) as EntityClass;
    } catch (error) {
      this.throwError(NotFoundException, ErrorTypeEnum.NOT_FOUND_ERROR, error as Error);
    }
  }

  /**
   * [description]
   * @param conditions
   */
  public async delete(conditions: FilterQuery<EntityClass>): Promise<number> {
    try {
      const filter = this.normalizeFilter(conditions);
      const result = await this.model.deleteMany(filter).exec();
      return result.deletedCount ?? 0;
    } catch (error) {
      this.throwError(ConflictException, ErrorTypeEnum.NOT_FOUND_ERROR, error as Error);
    }
  }
}
