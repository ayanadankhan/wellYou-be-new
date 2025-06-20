import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as AWS from 'aws-sdk';

@Injectable()
export class AwsService {
  private s3 = new AWS.S3({
    accessKeyId: 'AKIAS5T2HZKPDIMEI34Z',
    secretAccessKey: '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',
    region: 'eu-west-2',
  });

  private bucket = 'bitsbuffer';

  constructor(private readonly configService: ConfigService,) { }



  async uploadFile(file: Buffer, name: string, config = {}) {
    // Setting up S3 upload parameters
    const params = {
      Bucket: this.bucket,
      Key: name,
      Body: file,
    };

    // Uploading files to the bucket
    return this.s3.upload({ ...params, ...config }).promise();
  }

  /**
   * 
   * @param key The path of the file to be uploaded.
   * @param contentType A standard MIME type describing the format of the object data.
   * @param acl The permission to object which can be private | public-read | public-read-write | authenticated-read
   * @param expires The expiry time of the file url in seconds (Default is 10 minutes).
   * @param params Other parameters to pass to S3 getSignedUrl.
   * @returns File url
   */
  async getPreSignedUrl(key: string, contentType: string, acl = 'public-read', expires = 60 * 10, params = {}): Promise<string> {
    const s3Params = {
      Bucket: this.bucket,
      Expires: expires,
      ACL: acl,
      Key: key,
      ContentType: contentType,
    };

    return this.s3.getSignedUrl('putObject', { ...s3Params, ...params });
  }

  /**
   * Use it to get a signed url for file access.
   * @param key The path of the existing file to get a pre signed url.
   * @param expires The expiry time of the file url in seconds (Default is 10 minutes).
   * @returns File url
   */
  async getPresignedUrl(userId: string, key: string, expires = 60 * 10): Promise<string> {
    const s3Params = {
      Bucket: this.bucket,
      Expires: expires,
      Key: key
    };

    return this.s3.getSignedUrl('getObject', s3Params);
  }

  /**
   * Delete an object from the S3 bucket.
   * @param key The path of object to delete.
   * @returns 
   */
  async deleteObject(userId: string, key: string) {
    const s3Params = {
      Bucket: this.bucket,
      Key: key
    };

    return this.s3.deleteObject(s3Params);
  }

  /**
   * Delete objects from the S3 bucket.
   * @param keys Array of string keys to delete
   * @returns 
   */
  async deleteObjects(userId: string, keys: string[]) {
    const objects = keys.map(key => {
      return {
        Key: key
      }
    })

    const s3Params = {
      Bucket: this.bucket,
      Delete: {
        Objects: objects,
        Quiet: false
      }
    };
    try {
      await this.s3.deleteObjects(s3Params).promise();
      console.log('Objects deleted successfully');
    } catch (err) {
      console.error('Error deleting objects:', err);
    }
    // return this.s3.deleteObjects(s3Params);
  }
}
