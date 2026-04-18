import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { S3Service } from './s3.service';

@Controller('media')
export class MediaController {
  constructor(private readonly s3Service: S3Service) {}

  @Post('upload-url')
  @HttpCode(HttpStatus.OK)
  async getUploadUrl(
    @Body('fileName') fileName: string,
    @Body('contentType') contentType: string,
  ) {
    const url = await this.s3Service.getUploadUrl(fileName, contentType);
    return {
      uploadUrl: url,
      publicUrl: this.s3Service.getPublicUrl(url),
    };
  }
}
