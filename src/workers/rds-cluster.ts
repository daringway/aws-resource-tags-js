/* Copyright (C) 2019 Walter Derezinski - All Rights Reserved
 * You may use, distribute and modify this code under the
 * terms of the ISC license.
 */

import {AwsApiConfig, register, Tagger, Tags,} from './base';

class RDSTagger extends Tagger {
  protected getAwsApiConfig(): AwsApiConfig {
    return {
      awsLibraryName: 'RDS',
      awsApiVersion: '2014-10-31',
    };
  }

  protected async serviceGetTags(): Promise<Tags> {
    const params = {
      ResourceName: this.config.resourceArn,
    };
    return this.getAwsFunction().listTagsForResource(params).promise()
      .then((data) => Tagger.akvToMap(data.TagList));
  }

  protected async serviceUpdateTags(tags: Tags) {
    const params = {
      ResourceName: this.config.resourceArn,
      Tags: Tagger.kvMapToArray(tags),
    };

    return this.getAwsFunction().addTagsToResource(params).promise();
  }

  protected async serviceDeleteTags(tagKeys: string[]) {
    const params = {
      ResourceName: this.config.resourceArn,
      TagKeys: tagKeys,
    };

    return this.getAwsFunction().removeTagsFromResource(params).promise();
  }
}

register(RDSTagger, 'rds', 'cluster');
