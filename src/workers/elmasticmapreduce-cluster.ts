/* Copyright (C) 2019 Walter Derezinski - All Rights Reserved
 * You may use, distribute and modify this code under the
 * terms of the ISC license.
 */

import {AwsApiConfig, register, Tagger, Tags,} from './base';

export default class EmrClusterTagger extends Tagger {
  private state: string = null;

  protected getAwsApiConfig(): AwsApiConfig {
    return {
      awsLibraryName: 'EMR',
      awsApiVersion: '2009-03-31',
      rateLimit: 125,
      rateIncrease: 250,
      maxRateLimit: 2500,
    };
  }

  protected async serviceGetTags(): Promise<Tags> {
    const params = {
      ClusterId: this.config.resourceId,
    };
    const data = await this.getAwsFunction().describeCluster(params).promise();

    this.state = data.Cluster.Status.State;

    return Tagger.akvToMap(data.Cluster.Tags);
  }

  protected async _isTaggableState(): Promise<boolean> {
    try {
      if (this.state == null) {
        await this.serviceGetTags();
      }
    } catch (err) {
      if ('errorMessage' in err && err.errorMessage.indexOf('not valie') > 0) {
        return false;
      }
      throw err;
    }
    return !this.state.startsWith('TERM');
  }

  protected async serviceUpdateTags(tags: Tags) {
    const params = {
      ResourceId: this.config.resourceId,
      Tags: Tagger.kvMapToArray(tags),
    };
    try {
      await this.getAwsFunction().addTags(params).promise();
      return;
    } catch (err) {
      if (err.message === 'Tags cannot be modified on terminated clusters.') {

      } else {
        throw err;
      }
    }
  }

  protected async serviceDeleteTags(tagKeys: string[]) {
    const params = {
      ResourceId: this.config.resourceId,
      TagKeys: tagKeys,
    };
    return this.getAwsFunction().removeTags(params).promise();
  }
}

register(EmrClusterTagger, 'elasticmapreduce', 'cluster');
