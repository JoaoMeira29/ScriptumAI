import {
  Injectable,
  OnModuleInit,
  Logger,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import {
  UploadResult,
  UploadFileParams,
  GetPresignedUrlParams,
  FileStatsResult,
} from './interfaces/minio.interface';
import { isMinioError } from './utils/error.utils';

@Injectable()
export class MinioService implements OnModuleInit {
  private readonly logger = new Logger(MinioService.name);
  private client: Minio.Client;
  private bucketName: string;

  constructor(private readonly configService: ConfigService) {
    this.bucketName = this.configService.getOrThrow<string>('MINIO_BUCKET');

    this.client = new Minio.Client({
      endPoint: this.configService.getOrThrow<string>('MINIO_ENDPOINT'),
      port: this.configService.getOrThrow<number>('MINIO_PORT'),
      useSSL: this.configService.getOrThrow<boolean>('MINIO_USE_SSL'),
      accessKey: this.configService.getOrThrow<string>('MINIO_ACCESS_KEY'),
      secretKey: this.configService.getOrThrow<string>('MINIO_SECRET_KEY'),
    });
  }

  async onModuleInit() {
    // Verify if the bucket exists on startup
    const bucketExists = await this.client.bucketExists(this.bucketName);
    if (!bucketExists) {
      this.logger.warn(
        `Bucket "${this.bucketName}" does not exist. Creating...`,
      );
      try {
        await this.client.makeBucket(this.bucketName);
      } catch (error: any) {
        // Ignore "BucketAlreadyExists" error - it means another instance created it
        if (error.code !== 'BucketAlreadyExists') {
          throw error;
        }
        this.logger.log(
          `Bucket "${this.bucketName}" already exists (created by another instance)`,
        );
      }
    }
    this.logger.log(`MinIO connected. Bucket: ${this.bucketName}`);
  }

  /**
   * Upload a file to MinIO
   */
  async uploadFile(params: UploadFileParams): Promise<UploadResult> {
    const { objectKey, stream, size, mimeType } = params;

    try {
      const result = await this.client.putObject(
        this.bucketName,
        objectKey,
        stream,
        size,
        {
          'Content-Type': mimeType,
        },
      );

      this.logger.log(`Uploaded: ${objectKey} (${size} bytes)`);
      return {
        bucket: this.bucketName,
        key: objectKey,
        etag: result.etag,
      };
    } catch (error) {
      this.logger.error(`Failed to upload: ${objectKey}`, error);
      throw new InternalServerErrorException(
        `Storage Error: Could not upload file.`,
      );
    }
  }

  /**
   * Get a presigned URL for downloading a file.
   * @param public - when true, replaces internal hostname with MINIO_PUBLIC_URL (for external clients like mobile apps)
   */
  async getPresignedUrl(params: GetPresignedUrlParams & { public?: boolean }): Promise<string> {
    const { objectKey, public: isPublic = false } = params;

    try {
      const publicUrl = this.configService.get<string>('MINIO_PUBLIC_URL');
      if (isPublic && publicUrl) {
        return `${publicUrl.replace(/\/$/, '')}/${this.bucketName}/${objectKey}`;
      }

      const endpoint = this.configService.getOrThrow<string>('MINIO_ENDPOINT');
      const port = this.configService.getOrThrow<number>('MINIO_PORT');
      return `http://${endpoint}:${port}/${this.bucketName}/${objectKey}`;
    } catch (error) {
      this.logger.error(`Failed to generate URL for: ${objectKey}`, error);
      throw new InternalServerErrorException(
        'Could not generate download URL.',
      );
    }
  }

  /**
   * Delete a file
   */
  async deleteFile(objectKey: string): Promise<void> {
    try {
      await this.client.removeObject(this.bucketName, objectKey);
      this.logger.log(`Deleted: ${objectKey}`);
    } catch (error) {
      this.logger.error(`Failed to delete: ${objectKey}`, error);
      throw new InternalServerErrorException('Could not delete file.');
    }
  }

  /**
   * Get file stats
   */
  async getFileStats(objectKey: string): Promise<FileStatsResult> {
    try {
      const stats = await this.client.statObject(this.bucketName, objectKey);

      return {
        size: stats.size,
        etag: stats.etag,
        lastModified: stats.lastModified,
        contentType:
          (stats.metaData['content-type'] as string) ||
          'application/octet-stream',
      };
    } catch (error) {
      if (isMinioError(error) && error.code === 'NotFound') {
        throw new NotFoundException(`File ${objectKey} not found`);
      }
      this.logger.error(`Failed to get stats for: ${objectKey}`, error);
      throw new InternalServerErrorException('Could not retrieve file stats.');
    }
  }
}
