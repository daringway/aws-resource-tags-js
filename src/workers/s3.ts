/* Copyright (C) 2019 Walter Derezinski - All Rights Reserved
 * You may use, distribute and modify this code under the
 * terms of the ISC license.
 */

import {AwsApiConfig, register, Tagger, Tags,} from './base';

class S3Tagger extends Tagger {
  protected getAwsApiConfig(): AwsApiConfig {
    return {
      awsLibraryName: 'S3',
      awsApiVersion: '2006-03-01',
    };
  }

  protected async getResourceRegion(): Promise<string> {
    const params = {
      Bucket: this.config.resourceId,
    };
    const data = await this.getResourceAwsFunction().getBucketLocation(params).promise();
    return data.LocationConstraint;
  }

  protected async serviceGetTags(): Promise<Tags> {
    const params = {
      Bucket: this.config.resourceId,
    };
    const data = await this.getAwsFunction().getBucketTagging(params).promise();
    return Tagger.akvToMap(data.TagSet);
  }

  protected async _updateAndDeleteTags(tagsToUpdate: Tags, keysToDelete: string[]) {
    if ((Object.keys(keysToDelete).length
      + Object.keys(tagsToUpdate).length) == 0) {
      return;
    }

    const params = {
      Bucket: this.config.resourceId,
      Tagging: {
        TagSet: Tagger.kvMapToArray(this.tags),
      },
    };
    return this.getAwsFunction().putBucketTagging(params).promise();
  }

  // Overriding updateAndDeleteTags so these are not used by base class, need handle abstract
  protected async serviceDeleteTags(tagsToDeleteList: string[]) {
  }

  protected async serviceUpdateTags(tagMapUpdates: Tags) {
  }
}

register(S3Tagger, 's3');
