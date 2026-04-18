import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { S3Service } from './s3.service';
import { MediaController } from './media.controller';

@Module({
  imports: [ConfigModule],
  controllers: [MediaController],
  providers: [S3Service],
  exports: [S3Service],
})
export class MediaModule {}
