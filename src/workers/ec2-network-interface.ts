/* Copyright (C) 2019 Walter Derezinski - All Rights Reserved
 * You may use, distribute and modify this code under the
 * terms of the ISC license.
 */

import {register, Tagger, Tags} from './base';
import Ec2InstanceTagger from './ec2-instance';

class Ec2NetworkInterfaceTagger extends Ec2InstanceTagger {
  protected async serviceGetTags(): Promise<Tags> {
    const params = {
      NetworkInterfaceIds: [
        this.config.resourceId,
      ],
    };
    const data = await this.getAwsFunction().describeNetworkInterfaces(params).promise();
    return Tagger.akvToMap(data.NetworkInterfaces[0].TagSet);
  }

  protected async _isTaggableState(): Promise<boolean> {
    return true;
  }
}

register(Ec2NetworkInterfaceTagger, 'ec2', 'network-interface');
