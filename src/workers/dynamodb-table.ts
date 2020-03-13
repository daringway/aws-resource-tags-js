/* Copyright (C) 2019 Walter Derezinski - All Rights Reserved
 * You may use, distribute and modify this code under the
 * terms of the ISC license.
 */

import {AwsApiConfig, register, Tagger, Tags,} from './base';

class DynamoDBTagger extends Tagger {
  protected getAwsApiConfig(): AwsApiConfig {
    return {
      awsLibraryName: 'DynamoDB',
      awsApiVersion: '2012-08-10',
    };
  }

  protected async serviceGetTags(): Promise<Tags> {
    const params = {
      ResourceArn: this.config.resourceArn,
    };
    const data = await this.getAwsFunction().listTagsOfResource(params).promise();
    return Tagger.akvToMap(data.Tags);
  }

  protected async serviceUpdateTags(tags: Tags) {
    const params = {
      ResourceArn: this.config.resourceArn,
      Tags: Tagger.kvMapToArray(tags),
    };
    return this.getAwsFunction().tagResource(params).promise();
  }

  protected async serviceDeleteTags(tagList: string[]) {
    const params = {
      ResourceArn: this.config.resourceArn,
      TagKeys: tagList,
    };
    return this.getAwsFunction().untagResource(params).promise();
  }
}

register(DynamoDBTagger, 'dynamodb', 'table');
