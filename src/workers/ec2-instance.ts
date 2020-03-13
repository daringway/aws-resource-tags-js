/* Copyright (C) 2019 Walter Derezinski - All Rights Reserved
 * You may use, distribute and modify this code under the
 * terms of the ISC license.
 */

import {AwsApiConfig, register, Tagger, Tags,} from './base';

export default class Ec2InstanceTagger extends Tagger {
  protected state: string = null;

  protected getAwsApiConfig(): AwsApiConfig {
    return {
      awsLibraryName: 'EC2',
      awsApiVersion: '2016-11-15',
    };
  }

  protected async serviceGetTags(): Promise<Tags> {
    const params = {
      Filters: [
        {
          Name: 'resource-id',
          Values: [
            this.config.resourceId,
          ],
        },
      ],
    };
    const data = await this.getAwsFunction().describeTags(params).promise();
    return Tagger.akvToMap(data.Tags);
  }

  protected async serviceUpdateTags(tags: Tags) {
    const params = {
      Resources: [
        this.config.resourceId,
      ],
      Tags: Tagger.kvMapToArray(tags),
    };
    return this.getAwsFunction().createTags(params).promise();
  }

  protected async _isTaggableState(): Promise<boolean> {
    if (this.state == null) {
      const params = {
        InstanceIds: [
          this.config.resourceId,
        ],
      };
      try {
        const data = await this.getAwsFunction().describeInstances(params).promise();
        if (data.Reservations.length == 0) {
          return false;
        }
        this.state = data.Reservations[0].Instances[0].State.Name;
      } catch (err) {
        throw err;
      }
    }
    return ['running', 'stopping', 'stopped', 'pending'].includes(this.state);
  }

  protected async serviceDeleteTags(tagList: string[]) {
    const params = {
      Resources: [
        this.config.resourceId,
      ],
      Tags: Tagger.keyListToListMap(tagList),
    };
    return this.getAwsFunction().deleteTags(params).promise();
  }
}

register(Ec2InstanceTagger, 'ec2', 'instance');
