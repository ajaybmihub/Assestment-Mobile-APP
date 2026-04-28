import { Controller, Post, Body, HttpCode, HttpStatus, UseInterceptors, UploadedFile, Logger } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { S3Service } from './s3.service';

@Controller('media')
export class MediaController {
  private readonly logger = new Logger(MediaController.name);
  constructor(private readonly s3Service: S3Service) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: any) {
    this.logger.log(`Received upload request for file: ${file?.originalname}`);
    const url = await this.s3Service.uploadFile(file);
    return { url };
  }

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
