/* Copyright (C) 2019 Walter Derezinski - All Rights Reserved
 * You may use, distribute and modify this code under the
 * terms of the ISC license.
 */

import {
 AwsApiConfig, register, Tagger, Tags
} from './base';

export default class ASGTagger extends Tagger {
  protected data = undefined;

  public async getChildrenArns(): Promise<string[]> {
    await this.loadData();
    const values = this.data.AutoScalingGroups[0].Instances;
    const instances = [];
    for (let i = 0; i < values.length; i += 1) {
      // arn:aws:ec2:        region   :account-id  :instance/instance-id
      instances.push(`arn:aws:ec2:${this.config.region
      }:${this.config.accountId
      }:instance/${values[i].InstanceId}`);
    }
    return instances;
  }

  // eslint-disable-next-line class-methods-use-this
  protected getAwsApiConfig() : AwsApiConfig {
    const ret : AwsApiConfig = {
      awsLibraryName: 'AutoScaling',
      awsApiVersion: '2011-01-01',
    };
    return ret;
  }

  protected async loadData() {
    if (!this.data) {
      const params = {
        AutoScalingGroupNames: [
          this.config.resourceId,
        ],
      };
      this.data = await this.getAwsFunction().describeAutoScalingGroups(params).promise();
    }
  }

  protected async serviceGetTags(): Promise<Tags> {
    await this.loadData();
    return Tagger.akvToMap(this.data.AutoScalingGroups[0].Tags);
  }

  protected async serviceUpdateTags(tagMap: Tags) {
    const paramTags = [];
    for (const key in tagMap) {
      paramTags.push({
        Key: key,
        PropagateAtLaunch: true,
        ResourceId: this.config.resourceId,
        ResourceType: 'auto-scaling-group',
        Value: tagMap[key],
      });
    }

    const params = {
      Tags: paramTags,
    };

    return this.getAwsFunction().createOrUpdateTags(params).promise();
  }

  protected async serviceDeleteTags(tagList: string[]) {
    const tags = [];
    tagList.forEach(function (key) {
      tags.push({
        Key: key,
        ResourceId: this.config.resourceId,
        ResourceType: 'auto-scaling-group',
      });
    });

    const params = {
      Tags: tags,
    };

    return this.getAwsFunction().deleteTags(params).promise();
  }
}

register(ASGTagger, 'autoscaling', 'autoScalingGroup');
