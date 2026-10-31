import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable, Logger } from '@nestjs/common';

import { UtilsService } from '../utils/utils.service';

/**
 * Uploads files to an S3-compatible bucket (AWS S3, DigitalOcean Spaces, MinIO, ...).
 * Configured entirely from S3_* env vars; see .env.example.
 */
@Injectable()
export class CloudStorageService {
  private cloudStorageClient: S3Client;
  private storageBucketName: string;
  private storageBaseUrl: string;
  private logger = new Logger(CloudStorageService.name);

  constructor(private readonly utilsService: UtilsService) {
    this.cloudStorageClient = new S3Client({
      region: process.env.S3_REGION || 'us-east-1',
      endpoint: process.env.S3_ENDPOINT || undefined,
      credentials:
        process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY
          ? {
              accessKeyId: process.env.S3_ACCESS_KEY_ID,
              secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
            }
          : undefined,
    });
    this.storageBucketName = process.env.S3_BUCKET;
    this.storageBaseUrl = process.env.S3_PUBLIC_URL;
  }

  async uploadFile(file: Express.Multer.File, folderName: string): Promise<string> {
    this.logger.log(`uploading file=${file.originalname}`);
    const env = process.env.NODE_ENV || 'development';
    const { originalname, mimetype, buffer } = file;

    const fileExtension = originalname.substring(originalname.lastIndexOf('.') + 1).toLowerCase();

    let filePrefix: string;
    switch (fileExtension) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
      case 'webp':
        filePrefix = 'IMG';
        break;
      case 'mp3':
      case 'flac':
      case 'ogg':
        filePrefix = 'SOUND';
        break;
      case 'mp4':
        filePrefix = 'VIDEO';
        break;
      case 'pdf':
        filePrefix = 'PDF';
        break;
      default:
        filePrefix = 'FILE';
    }

    const id = this.utilsService.generateRandomString(4);
    const baseName = originalname.replace(/\.[^/.]+$/, '').replace(/ /g, '_');
    const fileKey = `${env}/uploads/${folderName.toLowerCase()}/${filePrefix}_${baseName}_${id}.${fileExtension}`;

    await this.cloudStorageClient.send(
      new PutObjectCommand({
        Bucket: this.storageBucketName,
        Key: fileKey,
        ContentType: mimetype,
        Body: buffer,
        ACL: 'public-read',
      }),
    );
    this.logger.log(`uploaded key=${fileKey}`);

    return `${this.storageBaseUrl}/${fileKey}`;
  }

  async deleteFile(key: string): Promise<void> {
    try {
      await this.cloudStorageClient.send(new DeleteObjectCommand({ Bucket: this.storageBucketName, Key: key }));
    } catch (error) {
      this.logger.error(`error deleting key=${key}: ${error}`);
    }
  }
}
