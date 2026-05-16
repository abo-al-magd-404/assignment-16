import {
  AnyKeys,
  CreateOptions,
  DeleteResult,
  FlattenMaps,
  HydratedDocument,
  Model,
  PopulateOptions,
  ProjectionType,
  QueryFilter,
  QueryOptions,
  ReturnsNewDoc,
  Types,
  UpdateQuery,
  UpdateResult,
  UpdateWithAggregationPipeline,
} from "mongoose";
import { IPaginate } from "../../common/interfaces";
import { UpdateOptions } from "mongodb";

export abstract class DatabaseRepository<TRawDoc> {
  constructor(protected readonly model: Model<TRawDoc>) {}

  //   CREATE
  async create({
    data,
  }: {
    data: Partial<TRawDoc>;
  }): Promise<HydratedDocument<TRawDoc>>;

  async create({
    data,
    options,
  }: {
    data: Partial<TRawDoc>[];
    options?: CreateOptions | undefined;
  }): Promise<HydratedDocument<TRawDoc>[]>;

  async create({
    data,
    options,
  }: {
    data: Partial<TRawDoc> | Partial<TRawDoc>[];
    options?: CreateOptions | undefined;
  }): Promise<HydratedDocument<TRawDoc> | HydratedDocument<TRawDoc>[]> {
    return await this.model.create(data as any, options);
  }

  async createOne({
    data,
    options,
  }: {
    data: Partial<TRawDoc>;
    options?: CreateOptions | undefined;
  }): Promise<HydratedDocument<TRawDoc>> {
    const [doc] = await this.create({
      data: [data],
      options,
    });

    return doc as HydratedDocument<TRawDoc>;
  }

  //   INSERT MANY
  async insertMany({
    data,
  }: {
    data: AnyKeys<TRawDoc>[];
  }): Promise<HydratedDocument<TRawDoc>[]> {
    return (await this.model.insertMany(
      data as any,
    )) as HydratedDocument<TRawDoc>[];
  }

  //   FIND
  async find({
    filter,
    projection,
    options,
  }: {
    filter?: QueryFilter<TRawDoc>;
    projection?: ProjectionType<TRawDoc> | null | undefined;
    options?: QueryOptions<TRawDoc> | null | undefined;
  }): Promise<HydratedDocument<TRawDoc>[]> {
    const doc = this.model.find(filter, projection);

    if (options?.populate) doc.populate(options.populate as PopulateOptions[]);
    if (options?.skip) doc.skip(options.skip);
    if (options?.limit) doc.limit(options.limit);

    return await doc.exec();
  }

  async findOne({
    filter,
    projection,
    options,
  }: {
    filter?: QueryFilter<TRawDoc>;
    projection?: ProjectionType<TRawDoc> | null | undefined;
    options?: (QueryOptions<TRawDoc> & { lean?: false }) | null | undefined;
  }): Promise<HydratedDocument<TRawDoc> | null>;

  async findOne({
    filter,
    projection,
    options,
  }: {
    filter?: QueryFilter<TRawDoc>;
    projection?: ProjectionType<TRawDoc> | null | undefined;
    options?: (QueryOptions<TRawDoc> & { lean?: true }) | null | undefined;
  }): Promise<null | FlattenMaps<TRawDoc>>;

  async findOne({
    filter,
    projection,
    options,
  }: {
    filter?: QueryFilter<TRawDoc>;
    projection?: ProjectionType<TRawDoc> | null | undefined;
    options?: QueryOptions<TRawDoc> | null | undefined;
  }): Promise<any> {
    const doc = this.model.findOne(filter, projection);

    if (options?.populate) doc.populate(options.populate as PopulateOptions[]);
    if (options?.lean) doc.lean(options.lean);

    return await doc.exec();
  }

  async findById({
    _id,
    projection,
    options,
  }: {
    _id?: Types.ObjectId;
    projection?: ProjectionType<TRawDoc> | null | undefined;
    options?: (QueryOptions<TRawDoc> & { lean: false }) | null | undefined;
  }): Promise<HydratedDocument<TRawDoc> | null>;

  async findById({
    _id,
    projection,
    options,
  }: {
    _id?: Types.ObjectId;
    projection?: ProjectionType<TRawDoc> | null | undefined;
    options?: (QueryOptions<TRawDoc> & { lean: true }) | null | undefined;
  }): Promise<null | FlattenMaps<TRawDoc>>;

  async findById({
    _id,
    projection,
    options,
  }: {
    _id?: Types.ObjectId;
    projection?: ProjectionType<TRawDoc> | null | undefined;
    options?: QueryOptions<TRawDoc> | null | undefined;
  }): Promise<any> {
    const doc = this.model.findById(_id, projection);

    if (options?.populate) doc.populate(options.populate as PopulateOptions[]);
    if (options?.lean) doc.lean(options.lean);

    return await doc.exec();
  }

  // UPDATE
  async findOneAndUpdate({
    filter,
    update,
    options = { new: true },
    populate = [],
  }: {
    filter: QueryFilter<TRawDoc>;
    update: UpdateQuery<TRawDoc>;
    options?: QueryOptions<TRawDoc> & ReturnsNewDoc;
    populate?: PopulateOptions[];
  }): Promise<HydratedDocument<TRawDoc> | null> {
    if (Array.isArray(update)) {
      update.push({ $set: { __v: { $add: ["$__v", 1] } } });
      return await this.model
        .findOneAndUpdate(filter, update, {
          ...options,
          updatePipeline: true,
        })
        .populate(populate);
    }
    return await this.model
      .findOneAndUpdate(filter, update, {
        ...options,
        $incr: { __v: 1 },
      })
      .populate(populate);
  }

  async updateOne({
    filter,
    update,
    options,
  }: {
    filter: QueryFilter<TRawDoc>;
    update: UpdateQuery<TRawDoc> | UpdateWithAggregationPipeline;
    options?: UpdateOptions | null;
  }): Promise<UpdateResult> {
    return await this.model.updateOne(
      filter,
      { ...update, $inc: { __v: 1 } },
      options,
    );
  }

  async findByIdAndUpdate({
    _id,
    update,
    options = { new: true },
  }: {
    _id: Types.ObjectId;
    update: UpdateQuery<TRawDoc>;
    options: QueryOptions<TRawDoc> & ReturnsNewDoc;
  }): Promise<HydratedDocument<TRawDoc> | null> {
    return await this.model.findByIdAndUpdate(
      _id,
      { ...update, $inc: { __v: 1 } },
      options,
    );
  }

  async updateMany({
    filter,
    update,
    options,
  }: {
    filter: QueryFilter<TRawDoc>;
    update: UpdateQuery<TRawDoc> | UpdateWithAggregationPipeline;
    options?: UpdateOptions | null;
  }): Promise<UpdateResult> {
    return await this.model.updateMany(filter, update, options);
  }

  // DELETE
  async findOneAndDelete({
    filter,
  }: {
    filter: QueryFilter<TRawDoc>;
  }): Promise<HydratedDocument<TRawDoc> | null> {
    return await this.model.findOneAndDelete(filter);
  }

  async findByIdAndDelete({
    _id,
  }: {
    _id: Types.ObjectId;
  }): Promise<HydratedDocument<TRawDoc> | null> {
    return await this.model.findByIdAndDelete(_id);
  }

  async deleteOne({
    filter,
  }: {
    filter: QueryFilter<TRawDoc>;
  }): Promise<DeleteResult> {
    return await this.model.deleteOne(filter);
  }

  async deleteMany({
    filter,
  }: {
    filter: QueryFilter<TRawDoc>;
  }): Promise<DeleteResult> {
    return await this.model.deleteMany(filter);
  }

  // PAGINATE
  async paginate({
    filter,
    projection,
    options = {},
    page = 0,
    size = 5,
  }: {
    filter?: QueryFilter<TRawDoc>;
    projection?: ProjectionType<TRawDoc> | null | undefined;
    options?: QueryOptions<TRawDoc>;
    page?: number | string | undefined;
    size?: number | string | undefined;
  }): Promise<IPaginate<TRawDoc>> {
    let count: number = -1;

    if (Number(page) > 0) {
      page = parseInt(page as string);
      size = parseInt(size as string);

      options.skip = (page - 1) * size;
      options.limit = size;

      count = await this.model.countDocuments({ filter });
    }

    const docs = await this.find({ filter: filter || {}, projection, options });

    return {
      docs,
      ...(Number(page) > 0
        ? {
            currentPage: page,
            size: size,
            pages: Math.ceil(count / parseInt(size as string)),
          }
        : {}),
    };
  }
}
