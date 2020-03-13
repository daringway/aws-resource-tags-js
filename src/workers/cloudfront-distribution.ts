/* Copyright (C) 2019 Walter Derezinski - All Rights Reserved
 * You may use, distribute and modify this code under the
 * terms of the ISC license.
 */

import {AwsApiConfig, register, Tagger, Tags,} from './base';

class CloudfrontDistributionTagger extends Tagger {
  protected getAwsApiConfig(): AwsApiConfig {
    return {
      awsLibraryName: 'CloudFront',
      awsApiVersion: '2018-11-05',
    };
  }

  protected async serviceGetTags(): Promise<Tags> {
    const params = {
      Resource: this.config.resourceArn,
    };

    const aws = this.getAws().awsFunction;
    const data = await aws.listTagsForResource(params).promise();
    return Tagger.akvToMap(data.Tags.Items);
  }

  protected async serviceUpdateTags(tags: Tags) {
    const params = {
      Resource: this.config.resourceArn,
      Tags: {
        Items: Tagger.kvMapToArray(tags),
      },
    };
    return this.getAwsFunction().tagResource(params).promise();
  }

  protected async serviceDeleteTags(tags: string[]) {
    const params = {
      Resource: this.config.resourceArn,
      TagKeys: {
        Items: tags,
      },
    };
    return this.getAwsFunction().untagResource(params).promise();
  }
}

register(CloudfrontDistributionTagger, 'cloudfront', 'distribution');
