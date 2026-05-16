"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloudinaryService = exports.CloudinaryService = void 0;
const cloudinary_1 = require("cloudinary");
const node_crypto_1 = require("node:crypto");
const node_fs_1 = require("node:fs");
const streamifier_1 = __importDefault(require("streamifier"));
const config_1 = require("../../config/config");
const exceptions_1 = require("../exceptions");
const enums_1 = require("../enums");
const axios_1 = __importDefault(require("axios"));
var ObjectCannedACL;
(function (ObjectCannedACL) {
    ObjectCannedACL["private"] = "private";
    ObjectCannedACL["publicRead"] = "public-read";
})(ObjectCannedACL || (ObjectCannedACL = {}));
class CloudinaryService {
    static IMAGE_EXTENSIONS = new Set([
        "jpg",
        "jpeg",
        "png",
        "gif",
        "webp",
        "bmp",
        "tiff",
        "svg",
        "avif",
        "heic",
    ]);
    static VIDEO_EXTENSIONS = new Set([
        "mp4",
        "mov",
        "avi",
        "mkv",
        "webm",
        "flv",
        "wmv",
        "m4v",
    ]);
    constructor() {
        cloudinary_1.v2.config({
            cloud_name: config_1.CLOUDINARY_CLOUD_NAME,
            api_key: config_1.CLOUDINARY_API_KEY,
            api_secret: config_1.CLOUDINARY_API_SECRET,
        });
    }
    toStorageError(status, key) {
        if (status === 400) {
            return {
                name: "NoSuchKey",
                message: "Invalid asset key or transformation parameters.",
                httpStatusCode: 400,
                Key: key,
            };
        }
        if (status === 401 || status === 403) {
            return {
                name: "AccessDenied",
                message: "Access denied.",
                httpStatusCode: status ?? 403,
                Key: key,
            };
        }
        return {
            name: "NoSuchKey",
            message: "The specified key does not exist.",
            httpStatusCode: status ?? 404,
            Key: key,
        };
    }
    getStorageMetadata(path, originalName) {
        const nameWithoutExt = originalName.replace(/\.[^/.]+$/, "");
        const extension = originalName.split(".").pop();
        const folder = `${config_1.APPLICATION_NAME}/${path}`.replace(/\/{2,}/g, "/");
        const publicId = `${(0, node_crypto_1.randomUUID)()}__${nameWithoutExt}`;
        return { folder, publicId, extension };
    }
    getAccessMode(acl) {
        return acl === ObjectCannedACL.private ? "authenticated" : "public";
    }
    resolveResourceType(format) {
        const ext = (format ?? "").toLowerCase();
        if (CloudinaryService.IMAGE_EXTENSIONS.has(ext))
            return "image";
        if (CloudinaryService.VIDEO_EXTENSIONS.has(ext))
            return "video";
        return "raw";
    }
    async resolveDeliveryVariant({ publicId, preferredResourceType, }) {
        const resourceTypes = [
            preferredResourceType,
            ...["image", "video", "raw"].filter((value) => value !== preferredResourceType),
        ];
        const deliveryTypes = [
            "authenticated",
            "upload",
        ];
        for (const resource_type of resourceTypes) {
            for (const type of deliveryTypes) {
                try {
                    await cloudinary_1.v2.api.resource(publicId, { resource_type, type });
                    return { resource_type, type };
                }
                catch (error) {
                    if (error?.http_code === 404)
                        continue;
                }
            }
        }
        throw this.toStorageError(404, publicId);
    }
    async uploadAsset({ storageApproach = enums_1.storageApproachEnum.MEMORY, path = "general", file, Acl = ObjectCannedACL.private, }) {
        const { folder, publicId } = this.getStorageMetadata(path, file.originalname);
        try {
            const result = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary_1.v2.uploader.upload_stream({
                    folder,
                    public_id: publicId,
                    resource_type: "auto",
                    access_mode: this.getAccessMode(Acl),
                }, (error, res) => {
                    if (error || !res)
                        return reject(error);
                    resolve(res);
                });
                if (storageApproach === enums_1.storageApproachEnum.MEMORY) {
                    streamifier_1.default.createReadStream(file.buffer).pipe(uploadStream);
                }
                else {
                    (0, node_fs_1.createReadStream)(file.path).pipe(uploadStream);
                }
            });
            return { Key: `${result.public_id}.${result.format}` };
        }
        catch (error) {
            throw new exceptions_1.BadRequestException("Fail to upload this asset");
        }
    }
    async uploadLargeAsset({ storageApproach = enums_1.storageApproachEnum.DISK, path = "general", file, Acl = ObjectCannedACL.private, }) {
        const { folder, publicId } = this.getStorageMetadata(path, file.originalname);
        const options = {
            folder,
            public_id: publicId,
            resource_type: "auto",
            chunk_size: 6000000,
            access_mode: this.getAccessMode(Acl),
        };
        try {
            const result = await new Promise((resolve, reject) => {
                if (storageApproach === enums_1.storageApproachEnum.MEMORY) {
                    const uploadStream = cloudinary_1.v2.uploader.upload_chunked_stream(options, (error, res) => {
                        if (error || !res)
                            return reject(error);
                        resolve(res);
                    });
                    streamifier_1.default.createReadStream(file.buffer).pipe(uploadStream);
                }
                else {
                    cloudinary_1.v2.uploader.upload_large(file.path, options, (error, res) => {
                        if (error || !res)
                            return reject(error);
                        resolve(res);
                    });
                }
            });
            return { Key: `${result.public_id}.${result.format}` };
        }
        catch (error) {
            throw new exceptions_1.BadRequestException("Fail to upload this asset");
        }
    }
    async uploadAssets({ uploadApproach = enums_1.uploadApproachEnum.SMALL, storageApproach = enums_1.storageApproachEnum.MEMORY, Bucket, path = "general", files, Acl = ObjectCannedACL.private, ContentType, }) {
        const uploadTasks = files.map((file) => {
            const params = {
                storageApproach,
                path,
                file,
                Acl,
                ContentType,
            };
            if (Bucket) {
                params.Bucket = Bucket;
            }
            return uploadApproach === enums_1.uploadApproachEnum.LARGE
                ? this.uploadLargeAsset(params).then((res) => res.Key)
                : this.uploadAsset(params).then((res) => res.Key);
        });
        return await Promise.all(uploadTasks);
    }
    async uploadFile(params) {
        return this.uploadAsset(params);
    }
    async createPresignedUploadLink({ path = "general", expiresIn = config_1.CLOUDINARY_EXPIRES_IN, Originalname, }) {
        const { folder, publicId, extension } = this.getStorageMetadata(path, Originalname);
        const fullPublicId = `${folder}/${publicId}`;
        const timestamp = Math.round(new Date().getTime() / 1000);
        const paramsToSign = {
            folder: folder,
            public_id: publicId,
            timestamp: timestamp,
            type: "authenticated",
        };
        const signature = cloudinary_1.v2.utils.api_sign_request(paramsToSign, config_1.CLOUDINARY_API_SECRET);
        const urlParams = new URLSearchParams({
            api_key: config_1.CLOUDINARY_API_KEY,
            timestamp: timestamp.toString(),
            type: "authenticated",
            signature: signature,
            folder: folder,
            public_id: publicId,
        });
        const url = `https://api.cloudinary.com/v1_1/${config_1.CLOUDINARY_CLOUD_NAME}/auto/upload?${urlParams.toString()}`;
        return {
            url,
            key: `${fullPublicId}.${extension}`,
        };
    }
    async createPresignedFetchLink({ Key, expiresIn = config_1.CLOUDINARY_EXPIRES_IN, download, fileName, }) {
        const lastDotIndex = Key.lastIndexOf(".");
        const hasExtension = lastDotIndex > 0 && lastDotIndex < Key.length - 1;
        const publicId = hasExtension ? Key.slice(0, lastDotIndex) : Key;
        const format = hasExtension ? Key.slice(lastDotIndex + 1) : undefined;
        const resourceType = this.resolveResourceType(format);
        const expiresAt = Math.round(Date.now() / 1000) + expiresIn;
        const deliveryVariant = await this.resolveDeliveryVariant({
            publicId,
            preferredResourceType: resourceType,
        });
        const finalFileName = fileName || Key.split("/").pop();
        return cloudinary_1.v2.url(publicId, {
            sign_url: true,
            secure: true,
            type: deliveryVariant.type,
            resource_type: deliveryVariant.resource_type,
            ...(format ? { format } : {}),
            expires_at: expiresAt,
            ...(download === "true"
                ? {
                    flags: "attachment",
                    attachment_filename: finalFileName,
                }
                : {}),
        });
    }
    async getAsset({ key }) {
        const lastDotIndex = key.lastIndexOf(".");
        const hasExtension = lastDotIndex > 0 && lastDotIndex < key.length - 1;
        const publicId = hasExtension ? key.slice(0, lastDotIndex) : key;
        const format = hasExtension ? key.slice(lastDotIndex + 1) : undefined;
        if (!format) {
            throw this.toStorageError(400, key);
        }
        const expires_at = Math.floor(Date.now() / 1000) + 60;
        const resourceTypes = [
            "image",
            "raw",
            "video",
        ];
        const deliveryTypes = [
            "authenticated",
            "upload",
        ];
        let lastStatus = 404;
        for (const resource_type of resourceTypes) {
            for (const type of deliveryTypes) {
                const signedDownloadUrl = cloudinary_1.v2.utils.private_download_url(publicId, format, {
                    resource_type,
                    type,
                    expires_at,
                });
                try {
                    const response = await axios_1.default.get(signedDownloadUrl, {
                        responseType: "stream",
                    });
                    return {
                        body: response.data,
                        ContentType: response.headers?.["content-type"] ??
                            undefined,
                    };
                }
                catch (error) {
                    const status = typeof error?.response?.status === "number"
                        ? error.response.status
                        : undefined;
                    if (status && status !== 404) {
                        throw this.toStorageError(status, key);
                    }
                    lastStatus = status ?? lastStatus;
                }
            }
        }
        throw this.toStorageError(lastStatus, key);
    }
    async deleteAsset(params) {
        const rawKey = params.Key;
        if (!rawKey)
            return;
        const lastDotIndex = rawKey.lastIndexOf(".");
        const withoutExtension = lastDotIndex > 0 ? rawKey.slice(0, lastDotIndex) : rawKey;
        const idParts = withoutExtension.split("/");
        const leafId = idParts[idParts.length - 1];
        const extension = lastDotIndex > 0 ? rawKey.slice(lastDotIndex + 1).toLowerCase() : "";
        const resource_type = this.resolveResourceType(extension);
        const idsToTry = [withoutExtension, leafId];
        const deliveryTypes = [
            "authenticated",
            "upload",
        ];
        console.log(`--- CLOUDINARY ATTEMPTING DELETE: ${leafId} ---`);
        for (const targetId of idsToTry) {
            if (!targetId)
                continue;
            for (const dType of deliveryTypes) {
                try {
                    const result = await cloudinary_1.v2.uploader.destroy(targetId, {
                        resource_type: resource_type,
                        type: dType,
                        invalidate: true,
                    });
                    if (result.result === "ok") {
                        console.log(`✅ DELETED SUCCESSFULLY: ${targetId} (${dType})`);
                        return result;
                    }
                }
                catch (err) {
                    continue;
                }
            }
        }
        console.log(`❌ All attempts failed for: ${rawKey}`);
        return { result: "not found" };
    }
    async deleteAssets({ keys, }) {
        if (!keys || keys.length === 0) {
            return { message: "No keys provided for deletion" };
        }
        try {
            console.log(`--- STARTING BULK DELETE FOR ${keys.length} ASSETS ---`);
            const deletePromises = keys.map((k) => this.deleteAsset({ Key: k.Key }));
            const results = await Promise.all(deletePromises);
            return {
                message: "Bulk delete operation completed",
                deletedCount: results.filter((r) => r.result === "ok").length,
                details: results.map((res, index) => ({
                    Key: keys[index].Key,
                    Status: res.result,
                })),
            };
        }
        catch (error) {
            const allKeysString = keys.map((k) => k.Key).join(", ");
            throw this.toStorageError(error.http_code || 500, allKeysString);
        }
    }
    async listFolderDir({ prefix, }) {
        const fullPrefix = `${config_1.APPLICATION_NAME}/${prefix}`;
        try {
            console.log(`--- LISTING CLOUDINARY ASSETS IN: ${fullPrefix} ---`);
            const result = await cloudinary_1.v2.api.resources({
                type: "upload",
                prefix: fullPrefix,
                resource_type: "image",
                max_results: 500,
            });
            const authResult = await cloudinary_1.v2.api.resources({
                type: "authenticated",
                prefix: fullPrefix,
                resource_type: "image",
                max_results: 500,
            });
            return {
                Contents: [...result.resources, ...authResult.resources].map((asset) => ({
                    Key: `${asset.public_id}.${asset.format}`,
                    Size: asset.bytes,
                    LastModified: asset.created_at,
                    Url: asset.secure_url,
                })),
                Prefix: fullPrefix,
            };
        }
        catch (error) {
            throw this.toStorageError(error.http_code || 500, fullPrefix);
        }
    }
    async deleteFolderByPrefix({ prefix, }) {
        const fullPrefix = `${config_1.APPLICATION_NAME}/${prefix}`;
        try {
            const resourceTypes = [
                "image",
                "video",
                "raw",
            ];
            const deletePromises = resourceTypes.map((type) => cloudinary_1.v2.api.delete_resources_by_prefix(fullPrefix, {
                resource_type: type,
                invalidate: true,
            }));
            const results = await Promise.all(deletePromises);
            try {
                await cloudinary_1.v2.api.delete_folder(fullPrefix);
            }
            catch (e) { }
            return { message: "Folder deleted", results };
        }
        catch (error) {
            throw this.toStorageError(error.http_code || 500, fullPrefix);
        }
    }
}
exports.CloudinaryService = CloudinaryService;
exports.cloudinaryService = new CloudinaryService();
