/* Copyright (C) 2019 Walter Derezinski - All Rights Reserved
 * You may use, distribute and modify this code under the
 * terms of the ISC license.
 */

import {register, Tagger, Tags} from './base';
import Ec2InstanceTagger from './ec2-instance';

class Ec2VolumeTagger extends Ec2InstanceTagger {
  protected async serviceGetTags(): Promise<Tags> {
    const params = {
      Filters: [
        {
          Name: 'volume-id',
          Values: [
            this.config.resourceId,
          ],
        },
      ],
    };
    const data = await this.getAwsFunction().describeVolumes(params).promise();
    return Tagger.akvToMap(data.Volumes[0].Tags);
  }

  protected async _isTaggableState(): Promise<boolean> {
    if (this.state == null) {
      const params = {
        Filters: [
          {
            Name: 'volume-id',
            Values: [
              this.config.resourceId,
            ],
          },
        ],
      };
      try {
        const data = await this.getAwsFunction().describeVolumes(params).promise();
        if (data.Volumes.length == 0) {
          return false;
        }
        this.state = data.Volumes[0].State;
      } catch (err) {
        throw err;
      }
    }
    return ['available', 'in-use'].includes(this.state);
  }
}

register(Ec2VolumeTagger, 'ec2', 'volume');
