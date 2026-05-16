"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseRepository = void 0;
class DatabaseRepository {
    model;
    constructor(model) {
        this.model = model;
    }
    async create({ data, options, }) {
        return await this.model.create(data, options);
    }
    async createOne({ data, options, }) {
        const [doc] = await this.create({
            data: [data],
            options,
        });
        return doc;
    }
    async insertMany({ data, }) {
        return (await this.model.insertMany(data));
    }
    async find({ filter, projection, options, }) {
        const doc = this.model.find(filter, projection);
        if (options?.populate)
            doc.populate(options.populate);
        if (options?.skip)
            doc.skip(options.skip);
        if (options?.limit)
            doc.limit(options.limit);
        return await doc.exec();
    }
    async findOne({ filter, projection, options, }) {
        const doc = this.model.findOne(filter, projection);
        if (options?.populate)
            doc.populate(options.populate);
        if (options?.lean)
            doc.lean(options.lean);
        return await doc.exec();
    }
    async findById({ _id, projection, options, }) {
        const doc = this.model.findById(_id, projection);
        if (options?.populate)
            doc.populate(options.populate);
        if (options?.lean)
            doc.lean(options.lean);
        return await doc.exec();
    }
    async findOneAndUpdate({ filter, update, options = { new: true }, populate = [], }) {
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
    async updateOne({ filter, update, options, }) {
        return await this.model.updateOne(filter, { ...update, $inc: { __v: 1 } }, options);
    }
    async findByIdAndUpdate({ _id, update, options = { new: true }, }) {
        return await this.model.findByIdAndUpdate(_id, { ...update, $inc: { __v: 1 } }, options);
    }
    async updateMany({ filter, update, options, }) {
        return await this.model.updateMany(filter, update, options);
    }
    async findOneAndDelete({ filter, }) {
        return await this.model.findOneAndDelete(filter);
    }
    async findByIdAndDelete({ _id, }) {
        return await this.model.findByIdAndDelete(_id);
    }
    async deleteOne({ filter, }) {
        return await this.model.deleteOne(filter);
    }
    async deleteMany({ filter, }) {
        return await this.model.deleteMany(filter);
    }
    async paginate({ filter, projection, options = {}, page = 0, size = 5, }) {
        let count = -1;
        if (Number(page) > 0) {
            page = parseInt(page);
            size = parseInt(size);
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
                    pages: Math.ceil(count / parseInt(size)),
                }
                : {}),
        };
    }
}
exports.DatabaseRepository = DatabaseRepository;
