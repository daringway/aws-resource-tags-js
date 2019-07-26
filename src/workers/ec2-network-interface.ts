'use strict';

/* Copyright (C) 2019 Walter Derezinski - All Rights Reserved
 * You may use, distribute and modify this code under the
 * terms of the ISC license.
 */

import {Tagger, Tags, register} from './base';
import Ec2InstanceTagger  from './ec2-instance';

class Ec2NetworkInterfaceTagger extends Ec2InstanceTagger {

    protected async _serviceGetTags() : Promise<Tags> {
        let params = {
            NetworkInterfaceIds: [
                this.config.resourceId
            ]
        };
        let data = await this.getAwsFunction().describeNetworkInterfaces(params).promise();
        return Tagger._akvToMap(data['NetworkInterfaces'][0]['TagSet']);

    };

    protected async _isTaggableState(): Promise<boolean> {
        return true;
    }
}

register(Ec2NetworkInterfaceTagger, 'ec2', 'network-interface');

