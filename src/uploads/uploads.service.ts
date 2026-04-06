import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UploadApiErrorResponse, UploadApiResponse, v2 } from 'cloudinary';
import toStream = require('streamifier');

@Injectable()
export class UploadsService {
  constructor(private configService: ConfigService) {
    const cloudinaryUrl = this.configService.get<string>('CLOUDINARY_URL');
    if (!cloudinaryUrl) {
      throw new Error('CLOUDINARY_URL is not defined');
    }
    const url = new URL(cloudinaryUrl);
    v2.config({
      cloud_name: url.host,
      api_key: url.username,
      api_secret: url.password,
    });
  }

  async uploadFile(file: Express.Multer.File): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const upload = v2.uploader.upload_stream(
        {
          folder: 'uploads',
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) return reject(error);
          if (!result) return reject(new Error('Upload failed'));
          resolve(result);
        },
      );

      toStream.createReadStream(file.buffer).pipe(upload);
    });
  }
}
