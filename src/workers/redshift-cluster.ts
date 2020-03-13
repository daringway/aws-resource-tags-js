/* Copyright (C) 2019 Walter Derezinski - All Rights Reserved
 * You may use, distribute and modify this code under the
 * terms of the ISC license.
 */

import {AwsApiConfig, register, Tagger, Tags,} from './base';

class RedshiftTagger extends Tagger {
  protected getAwsApiConfig(): AwsApiConfig {
    return {
      awsLibraryName: 'Redshift',
      awsApiVersion: '2012-12-01',
    };
  }

  protected async serviceGetTags(): Promise<Tags> {
    const params = {
      ResourceName: this.config.resourceArn,
    };
    const data = await this.getAwsFunction().describeTags(params).promise();
    const tags = {};
    data.TaggedResources.forEach((iData) => {
      const tag = iData.Tag;
      tags[tag.Key] = tag.Value;
    });
    return (tags);
  }

  protected async serviceUpdateTags(tags: Tags) {
    const params = {
      ResourceName: this.config.resourceArn,
      Tags: Tagger.kvMapToArray(tags),
    };
    return this.getAwsFunction().createTags(params).promise();
  }

  protected async serviceDeleteTags(tagKeys: string[]) {
    const params = {
      ResourceName: this.config.resourceArn,
      TagKeys: tagKeys,
    };
    return this.getAwsFunction().deleteTags(params).promise();
  }
}

register(RedshiftTagger, 'redshift', 'cluster');
