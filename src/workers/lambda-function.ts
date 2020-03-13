/* Copyright (C) 2019 Walter Derezinski - All Rights Reserved
 * You may use, distribute and modify this code under the
 * terms of the ISC license.
 */

import {AwsApiConfig, register, Tagger, Tags,} from './base';

class LambdaTagger extends Tagger {
  protected getAwsApiConfig(): AwsApiConfig {
    return {
      awsLibraryName: 'Lambda',
      awsApiVersion: '2015-03-31',
    };
  }

  protected async serviceGetTags(): Promise<Tags> {
    const params = {
      Resource: this.config.resourceArn,
    };

    const data = await this.getAwsFunction().listTags(params).promise();
    return data.Tags;
  }

  protected async serviceUpdateTags(tags: Tags) {
    const params = {
      Resource: this.config.resourceArn,
      Tags: tags,
    };

    return this.getAwsFunction().tagResource(params).promise();
  }

  protected async serviceDeleteTags(tags: string[]) {
    const params = {
      Resource: this.config.resourceArn,
      TagKeys: tags,
    };

    return this.getAwsFunction().untagResource(params).promise();
  }
}

register(LambdaTagger, 'lambda', 'function');
