import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Service {
  private s3Client: S3Client;

  constructor(private configService: ConfigService) {
    this.s3Client = new S3Client({
      region: this.configService.get<string>('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID') || '',
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY') || '',
      },
    });
  }

  async getUploadUrl(fileName: string, contentType: string): Promise<string> {
    const bucket = this.configService.get<string>('AWS_S3_BUCKET');
    const key = `interviews/${Date.now()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    });

    // URL expires in 15 minutes
    return await getSignedUrl(this.s3Client, command, { expiresIn: 900 });
  }

  // Helper to extract the public URL once uploaded
  getPublicUrl(s3SignedUrl: string): string {
    // S3 signed URLs are structured as https://bucket.s3.region.amazonaws.com/key?parameters
    // We just want the base part before the '?'
    return s3SignedUrl.split('?')[0];
  }
}
