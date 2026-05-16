import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import streamifier from "streamifier";
import {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  APPLICATION_NAME,
  CLOUDINARY_EXPIRES_IN,
} from "../../config/config";
import { BadRequestException } from "../exceptions";
import { storageApproachEnum, uploadApproachEnum } from "../enums";
import axios from "axios";
import type {
  AssetStorage,
  StorageError,
  StorageGetAssetResult,
} from "../interfaces";

// To match S3 Canned ACL naming convention
enum ObjectCannedACL {
  private = "private",
  publicRead = "public-read",
}

export class CloudinaryService {
  private static readonly IMAGE_EXTENSIONS = new Set([
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

  private static readonly VIDEO_EXTENSIONS = new Set([
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
    cloudinary.config({
      cloud_name: CLOUDINARY_CLOUD_NAME,
      api_key: CLOUDINARY_API_KEY,
      api_secret: CLOUDINARY_API_SECRET,
    });
  }

  private toStorageError(
    status: number | undefined,
    key: string,
  ): StorageError {
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

  /**
   * Cloudinary's "Public ID" acts like S3's "Key".
   * To match your S3 logic: {APPLICATION_NAME}/{path}/{uuid}__{filename}
   */
  private getStorageMetadata(path: string, originalName: string) {
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, "");
    const extension = originalName.split(".").pop();
    const folder = `${APPLICATION_NAME}/${path}`.replace(/\/{2,}/g, "/");
    const publicId = `${randomUUID()}__${nameWithoutExt}`;
    return { folder, publicId, extension };
  }

  private getAccessMode(acl: ObjectCannedACL): "authenticated" | "public" {
    return acl === ObjectCannedACL.private ? "authenticated" : "public";
  }

  private resolveResourceType(format?: string): "image" | "video" | "raw" {
    const ext = (format ?? "").toLowerCase();
    if (CloudinaryService.IMAGE_EXTENSIONS.has(ext)) return "image";
    if (CloudinaryService.VIDEO_EXTENSIONS.has(ext)) return "video";
    return "raw";
  }

  private async resolveDeliveryVariant({
    publicId,
    preferredResourceType,
  }: {
    publicId: string;
    preferredResourceType: "image" | "video" | "raw";
  }): Promise<{
    resource_type: "image" | "video" | "raw";
    type: "authenticated" | "upload";
  }> {
    const resourceTypes: Array<"image" | "video" | "raw"> = [
      preferredResourceType,
      ...(["image", "video", "raw"] as const).filter(
        (value) => value !== preferredResourceType,
      ),
    ];
    const deliveryTypes: Array<"authenticated" | "upload"> = [
      "authenticated",
      "upload",
    ];

    for (const resource_type of resourceTypes) {
      for (const type of deliveryTypes) {
        try {
          await cloudinary.api.resource(publicId, { resource_type, type });
          return { resource_type, type };
        } catch (error: any) {
          if (error?.http_code === 404) continue;
        }
      }
    }

    throw this.toStorageError(404, publicId);
  }

  // ===== UPLOAD SINGLE ASSET =====
  async uploadAsset({
    storageApproach = storageApproachEnum.MEMORY,
    path = "general",
    file,
    Acl = ObjectCannedACL.private,
  }: {
    storageApproach?: storageApproachEnum;
    Bucket?: string;
    path?: string;
    file: Express.Multer.File;
    Acl?: ObjectCannedACL;
    ContentType?: string | undefined;
  }): Promise<{ Key: string }> {
    const { folder, publicId } = this.getStorageMetadata(
      path,
      file.originalname,
    );

    try {
      const result = await new Promise<UploadApiResponse>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            public_id: publicId,
            resource_type: "auto",
            access_mode: this.getAccessMode(Acl),
          },
          (error, res) => {
            if (error || !res) return reject(error);
            resolve(res);
          },
        );

        if (storageApproach === storageApproachEnum.MEMORY) {
          streamifier.createReadStream(file.buffer).pipe(uploadStream);
        } else {
          createReadStream(file.path).pipe(uploadStream);
        }
      });

      return { Key: `${result.public_id}.${result.format}` };
    } catch (error) {
      throw new BadRequestException("Fail to upload this asset");
    }
  }

  // ===== UPLOAD LARGE ASSET =====
  async uploadLargeAsset({
    storageApproach = storageApproachEnum.DISK,
    path = "general",
    file,
    Acl = ObjectCannedACL.private,
  }: {
    storageApproach?: storageApproachEnum;
    Bucket?: string;
    path?: string;
    file: Express.Multer.File;
    Acl?: ObjectCannedACL;
    ContentType?: string | undefined;
  }): Promise<{ Key: string }> {
    const { folder, publicId } = this.getStorageMetadata(
      path,
      file.originalname,
    );

    const options = {
      folder,
      public_id: publicId,
      resource_type: "auto" as const,
      chunk_size: 6000000,
      access_mode: this.getAccessMode(Acl),
    };

    try {
      const result = await new Promise<UploadApiResponse>((resolve, reject) => {
        if (storageApproach === storageApproachEnum.MEMORY) {
          const uploadStream = cloudinary.uploader.upload_chunked_stream(
            options,
            (error, res) => {
              if (error || !res) return reject(error);
              resolve(res);
            },
          );
          streamifier.createReadStream(file.buffer).pipe(uploadStream);
        } else {
          cloudinary.uploader.upload_large(file.path, options, (error, res) => {
            if (error || !res) return reject(error);
            resolve(res);
          });
        }
      });

      return { Key: `${result.public_id}.${result.format}` };
    } catch (error) {
      throw new BadRequestException("Fail to upload this asset");
    }
  }

  // ===== UPLOAD MULTIPLE ASSETS =====
  async uploadAssets({
    uploadApproach = uploadApproachEnum.SMALL,
    storageApproach = storageApproachEnum.MEMORY,
    Bucket,
    path = "general",
    files,
    Acl = ObjectCannedACL.private,
    ContentType,
  }: {
    uploadApproach?: uploadApproachEnum;
    storageApproach?: storageApproachEnum;
    Bucket?: string;
    path?: string;
    files: Express.Multer.File[];
    Acl?: ObjectCannedACL;
    ContentType?: string | undefined;
  }): Promise<string[]> {
    const uploadTasks = files.map((file) => {
      const params: {
        storageApproach?: storageApproachEnum;
        path?: string;
        file: Express.Multer.File;
        Acl?: ObjectCannedACL;
        ContentType?: string | undefined;
        Bucket?: string;
      } = {
        storageApproach,
        path,
        file,
        Acl,
        ContentType,
      };

      if (Bucket) {
        params.Bucket = Bucket;
      }

      return uploadApproach === uploadApproachEnum.LARGE
        ? this.uploadLargeAsset(params).then((res) => res.Key)
        : this.uploadAsset(params).then((res) => res.Key);
    });

    return await Promise.all(uploadTasks);
  }

  async uploadFile(params: Parameters<CloudinaryService["uploadAsset"]>[0]) {
    return this.uploadAsset(params);
  }

  // ===== CREATE PRESIGNED UPLOAD LINK =====
  async createPresignedUploadLink({
    path = "general",
    expiresIn = CLOUDINARY_EXPIRES_IN,
    Originalname,
  }: {
    path?: string;
    expiresIn?: number;
    Originalname: string;
  }): Promise<{ url: string; key: string }> {
    const { folder, publicId, extension } = this.getStorageMetadata(
      path,
      Originalname,
    );
    const fullPublicId = `${folder}/${publicId}`;

    const timestamp = Math.round(new Date().getTime() / 1000);

    const paramsToSign = {
      folder: folder,
      public_id: publicId,
      timestamp: timestamp,
      type: "authenticated",
    };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      CLOUDINARY_API_SECRET,
    );

    const urlParams = new URLSearchParams({
      api_key: CLOUDINARY_API_KEY,
      timestamp: timestamp.toString(),
      type: "authenticated",
      signature: signature,
      folder: folder,
      public_id: publicId,
    });

    const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload?${urlParams.toString()}`;

    return {
      url,
      key: `${fullPublicId}.${extension}`,
    };
  }

  // ===== CREATE PRESIGNED FETCH LINK (The S3-Way Roots) =====
  async createPresignedFetchLink({
    Key,
    expiresIn = CLOUDINARY_EXPIRES_IN,
    download,
    fileName,
  }: {
    Key: string;
    expiresIn?: number;
    fileName?: string;
    download?: string;
  }): Promise<string> {
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

    return cloudinary.url(publicId, {
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

  // ===== GET ASSET (S3 GET OBJECT MATCH) =====
  async getAsset({ key }: { key: string }): Promise<StorageGetAssetResult> {
    const lastDotIndex = key.lastIndexOf(".");
    const hasExtension = lastDotIndex > 0 && lastDotIndex < key.length - 1;
    const publicId = hasExtension ? key.slice(0, lastDotIndex) : key;
    const format = hasExtension ? key.slice(lastDotIndex + 1) : undefined;

    if (!format) {
      throw this.toStorageError(400, key);
    }

    const expires_at = Math.floor(Date.now() / 1000) + 60;
    const resourceTypes: Array<"image" | "raw" | "video"> = [
      "image",
      "raw",
      "video",
    ];
    const deliveryTypes: Array<"authenticated" | "upload"> = [
      "authenticated",
      "upload",
    ];

    let lastStatus: number | undefined = 404;

    for (const resource_type of resourceTypes) {
      for (const type of deliveryTypes) {
        const signedDownloadUrl = cloudinary.utils.private_download_url(
          publicId,
          format,
          {
            resource_type,
            type,
            expires_at,
          },
        );

        try {
          const response = await axios.get(signedDownloadUrl, {
            responseType: "stream",
          });
          return {
            body: response.data as NodeJS.ReadableStream,
            ContentType:
              (response.headers?.["content-type"] as string | undefined) ??
              undefined,
          };
        } catch (error: any) {
          const status =
            typeof error?.response?.status === "number"
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

  // ===== DELETE ASSET (S3 DELETE OBJECT MATCH) =====
  async deleteAsset(params: { Key: string; Bucket?: string }): Promise<any> {
    const rawKey = params.Key;
    if (!rawKey) return;

    const lastDotIndex = rawKey.lastIndexOf(".");
    const withoutExtension =
      lastDotIndex > 0 ? rawKey.slice(0, lastDotIndex) : rawKey;

    const idParts = withoutExtension.split("/");
    const leafId = idParts[idParts.length - 1];

    const extension =
      lastDotIndex > 0 ? rawKey.slice(lastDotIndex + 1).toLowerCase() : "";
    const resource_type = this.resolveResourceType(extension);

    const idsToTry = [withoutExtension, leafId];
    const deliveryTypes: ("authenticated" | "upload")[] = [
      "authenticated",
      "upload",
    ];

    console.log(`--- CLOUDINARY ATTEMPTING DELETE: ${leafId} ---`);

    for (const targetId of idsToTry) {
      if (!targetId) continue;
      for (const dType of deliveryTypes) {
        try {
          const result = await cloudinary.uploader.destroy(targetId as string, {
            resource_type: resource_type,
            type: dType,
            invalidate: true,
          });

          if (result.result === "ok") {
            console.log(`✅ DELETED SUCCESSFULLY: ${targetId} (${dType})`);
            return result;
          }
        } catch (err) {
          continue;
        }
      }
    }

    console.log(`❌ All attempts failed for: ${rawKey}`);
    return { result: "not found" };
  }

  // ===== DELETE MULTIPLE ASSETS (MATCHING S3 LOGIC) =====
  async deleteAssets({
    keys,
  }: {
    Bucket?: string;
    keys: { Key: string }[];
  }): Promise<any> {
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
          Key: keys[index]!.Key,
          Status: res.result,
        })),
      };
    } catch (error: any) {
      const allKeysString = keys.map((k) => k.Key).join(", ");
      throw this.toStorageError(error.http_code || 500, allKeysString);
    }
  }

  // ===== Get list folder (MATCHING S3 LOGIC) =====
  async listFolderDir({
    prefix,
  }: {
    Bucket?: string;
    prefix: string;
  }): Promise<any> {
    const fullPrefix = `${APPLICATION_NAME}/${prefix}`;

    try {
      console.log(`--- LISTING CLOUDINARY ASSETS IN: ${fullPrefix} ---`);

      const result = await cloudinary.api.resources({
        type: "upload",
        prefix: fullPrefix,
        resource_type: "image",
        max_results: 500,
      });

      const authResult = await cloudinary.api.resources({
        type: "authenticated",
        prefix: fullPrefix,
        resource_type: "image",
        max_results: 500,
      });

      return {
        Contents: [...result.resources, ...authResult.resources].map(
          (asset) => ({
            Key: `${asset.public_id}.${asset.format}`,
            Size: asset.bytes,
            LastModified: asset.created_at,
            Url: asset.secure_url,
          }),
        ),
        Prefix: fullPrefix,
      };
    } catch (error: any) {
      throw this.toStorageError(error.http_code || 500, fullPrefix);
    }
  }

  // ===== Delete folder by prefix (MATCHING S3 LOGIC) =====
  async deleteFolderByPrefix({
    prefix,
  }: {
    Bucket?: string;
    prefix: string;
  }): Promise<any> {
    const fullPrefix = `${APPLICATION_NAME}/${prefix}`;

    try {
      const resourceTypes: Array<"image" | "video" | "raw"> = [
        "image",
        "video",
        "raw",
      ];

      const deletePromises = resourceTypes.map((type) =>
        cloudinary.api.delete_resources_by_prefix(fullPrefix, {
          resource_type: type,
          invalidate: true,
        }),
      );

      const results = await Promise.all(deletePromises);

      try {
        await cloudinary.api.delete_folder(fullPrefix);
      } catch (e) {}

      return { message: "Folder deleted", results };
    } catch (error: any) {
      throw this.toStorageError(error.http_code || 500, fullPrefix);
    }
  }
}

export const cloudinaryService: AssetStorage =
  new CloudinaryService() as unknown as AssetStorage;
