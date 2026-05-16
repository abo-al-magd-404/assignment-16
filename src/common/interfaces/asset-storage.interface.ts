export type StorageGetAssetResult = {
  body: NodeJS.ReadableStream;
  ContentType?: string | undefined;
};

export type StorageErrorName = "NoSuchKey" | "AccessDenied";

export type StorageError = {
  name: StorageErrorName;
  message: string;
  httpStatusCode: number;
  Key: string;
};

export type StorageUploadParams = {
  storageApproach?: any;
  Bucket?: string | undefined;
  path?: string | undefined;
  file: Express.Multer.File;
  Acl?: string | undefined;
  ContentType?: string | undefined;
};

export type StorageUploadManyParams = Omit<StorageUploadParams, "file"> & {
  uploadApproach?: any;
  files: Express.Multer.File[];
};

export type StoragePresignedParams = {
  Bucket?: string | undefined;
  path?: string | undefined;
  expiresIn?: number | undefined;
  ContentType?: string | undefined;
  Originalname: string;
};

export type StorageGetParams = {
  Bucket?: string | undefined;
  key: string;
};

export interface AssetStorage {
  uploadAsset(params: StorageUploadParams): Promise<{ Key: string }>;

  uploadLargeAsset(params: StorageUploadParams): Promise<{ Key: string }>;

  uploadAssets(params: StorageUploadManyParams): Promise<string[]>;

  createPresignedUploadLink(
    params: StoragePresignedParams,
  ): Promise<{ url: string; key: string }>;

  createPresignedFetchLink(params: {
    Key: string;
    expiresIn?: number;
    fileName?: string;
    download?: string;
  }): Promise<string>;

  getAsset(params: StorageGetParams): Promise<StorageGetAssetResult>;

  deleteAsset(params: { Key: string; Bucket?: string }): Promise<any>;

  deleteAssets(params: {
    keys: { Key: string }[];
    Bucket?: string;
  }): Promise<any>;

  listFolderDir(params: { prefix: string; Bucket?: string }): Promise<any>;

  deleteFolderByPrefix(params: {
    prefix: string;
    Bucket?: string;
  }): Promise<any>;
}
