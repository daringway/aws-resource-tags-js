/* Copyright (C) 2019 Walter Derezinski - All Rights Reserved
 * You may use, distribute and modify this code under the
 * terms of the ISC license.
 */

import {AwsApiConfig, register, Tagger, Tags,} from './base';

class ElasticSearchTagger extends Tagger {
  protected getAwsApiConfig(): AwsApiConfig {
    return {
      awsLibraryName: 'ES',
      awsApiVersion: '2015-01-01',
    };
  }

  protected async serviceGetTags(): Promise<Tags> {
    const params = {
      ARN: this.config.resourceArn,
    };
    const data = await this.getAwsFunction().listTags(params).promise();
    return Tagger.akvToMap(data.TagList);
  }

  protected async serviceUpdateTags(tags: Tags) {
    const params = {
      ARN: this.config.resourceArn,
      TagList: Tagger.kvMapToArray(tags),
    };
    return this.getAwsFunction().addTags(params).promise();
  }

  protected async serviceDeleteTags(tagKeys: string[]) {
    const params = {
      ARN: this.config.resourceArn,
      TagKeys: tagKeys,
    };
    return this.getAwsFunction().removeTags(params).promise();
  }
}

register(ElasticSearchTagger, 'es', 'domain');
